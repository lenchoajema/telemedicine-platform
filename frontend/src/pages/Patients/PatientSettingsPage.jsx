import React, { useState, useEffect } from "react";
import "./PatientSettingsPage.css";
import apiClient from "../../api/apiClient";

const PatientSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Profile Settings
  const [profileData, setProfileData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    dateOfBirth: "1990-05-15",
    gender: "male",
    address: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    emergencyContact: "Jane Doe",
    emergencyPhone: "+1 (555) 987-6543",
    weightKg: "",
    heightCm: "",
    bloodType: "",
  });

  // Medical Information
  const [medicalData, setMedicalData] = useState({
    bloodType: "O+",
    allergies: "Penicillin, Shellfish",
    medications: "Lisinopril 10mg daily",
    medicalConditions: "Hypertension",
    primaryDoctor: "Dr. Sarah Johnson",
    insurance: "Blue Cross Blue Shield",
    policyNumber: "BC123456789",
  });

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    appointmentReminders: true,
    emailNotifications: true,
    smsNotifications: false,
    medicationReminders: true,
    healthTips: true,
    marketingEmails: false,
  });

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    shareDataWithDoctors: true,
    allowDataAnalytics: false,
    shareWithInsurance: true,
    publicProfile: false,
  });

  // Security Settings
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorAuth: false,
    twoFactorType: "App",
  });

  // Family Settings
  const [family, setFamily] = useState({
    members: [],
    group: null,
    actingAsUserId: null,
  });
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("adult");

  // Insurance
  const [insurances, setInsurances] = useState([]);
  const [newInsurance, setNewInsurance] = useState({
    provider: "",
    plan: "",
    memberId: "",
    policyNumber: "",
    groupNumber: "",
    isPrimary: false,
  });

  // Billing / Payment Methods
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newPayment, setNewPayment] = useState({
    type: "card",
    brand: "",
    last4: "",
    expMonth: "",
    expYear: "",
    cardholderName: "",
    billingAddress: {
      line1: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    isDefault: false,
  });

  // Pricing / Quote / Checkout (demo panel)
  const [services, setServices] = useState([]);
  const [pricingRegion, setPricingRegion] = useState("ET");
  const [pricingPayerType, setPricingPayerType] = useState("SelfPay");
  const [selectedServiceCode, setSelectedServiceCode] = useState("");
  const [qty, setQty] = useState(1);
  const [quote, setQuote] = useState(null);
  const [intent, setIntent] = useState(null);
  const [checkoutMethod, setCheckoutMethod] = useState("card"); // card | bank | mobile
  const [checkoutProvider, setCheckoutProvider] = useState(""); // mpesa | telebirr | bank code
  const [walletPhone, setWalletPhone] = useState("");
  // Bank Directory (for bank transfers)
  const [bankCountry, setBankCountry] = useState("ET");
  const [bankSearch, setBankSearch] = useState("");
  const [banks, setBanks] = useState([]);
  const [bankProvider, setBankProvider] = useState("paystack"); // aggregator to resolve codes
  const [selectedBankId, setSelectedBankId] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [bankNotListed, setBankNotListed] = useState(false);
  const [manualBankName, setManualBankName] = useState("");
  const [quotes, setQuotes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // V2 aggregated load
  const [versions, setVersions] = useState({
    profile: 0,
    medical: 0,
    notifications: 0,
    privacy: 0,
    security: 0,
    composite: "",
  });
  useEffect(() => {
    const loadAggregated = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/users/self/settings`); // backend alias 'self'
        const data = res.data || {};
        const p = data.profile || {};
        setProfileData((prev) => ({
          ...prev,
          firstName: p.firstName || "",
          lastName: p.lastName || "",
          email: data.profile?.email || prev.email, // email may still come from auth user state elsewhere
          phone: p.phone || "",
          dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : "",
          gender: p.gender || "other",
          address: p.addressLine1 || "",
          city: p.city || "",
          state: p.state || "",
          zipCode: p.postalCode || "",
          emergencyContact: p.emergencyContactName || "",
          emergencyPhone: p.emergencyContactPhone || "",
          weightKg: p.weightKg || "",
          heightCm: p.heightCm || "",
          bloodType: p.bloodType || "",
        }));
        const med = data.medical || {};
        setMedicalData((prev) => ({
          ...prev,
          bloodType: med.bloodType || p.bloodType || prev.bloodType,
          allergies: (med.allergies || []).join(", "),
          medications: (med.currentMedications || []).join(", "),
          medicalConditions: (med.medicalConditions || []).join(", "),
        }));
        const notif = data.notifications || {};
        setNotifications((prev) => ({
          ...prev,
          appointmentReminders: !!notif.appointmentReminders,
          emailNotifications: !!notif.emailGeneral,
          smsNotifications: !!notif.smsGeneral,
          medicationReminders: !!notif.medicationReminders,
          healthTips: !!notif.healthContent,
          marketingEmails: !!notif.marketing,
        }));
        const priv = data.privacy || {};
        setPrivacy((prev) => ({
          ...prev,
          shareDataWithDoctors: !!priv.shareWithProviders,
          allowDataAnalytics: !!priv.shareAnonymizedResearch,
          shareWithInsurance: !!priv.shareWithInsurance,
          publicProfile: !!priv.publicProfileVisible,
        }));
        setSecurity((prev) => ({
          ...prev,
          twoFactorAuth: !!data.securityMeta?.twoFactorEnabled,
          twoFactorType:
            data.securityMeta?.twoFactorType || prev.twoFactorType || "App",
        }));
        const fam = data.family || {
          group: null,
          members: [],
          actingAsUserId: null,
        };
        setFamily({
          members: fam.members || [],
          group: fam.group || null,
          actingAsUserId: fam.actingAsUserId || null,
        });
        setInsurances(data.insurance || []);
        setPaymentMethods(data.paymentMethods || []);
        setVersions({
          profile: p.version || 0,
          medical: med.version || 0,
          notifications: notif.version || 0,
          privacy: priv.version || 0,
          security: data.securityMeta?.version || 0,
          composite: data.compositeVersion || "",
        });
      } catch (e) {
        setSaveMessage("Failed to load settings");
        setTimeout(() => setSaveMessage(""), 3000);
      } finally {
        setLoading(false);
      }
    };
    loadAggregated();
  }, []);

  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMedicalChange = (field, value) => {
    setMedicalData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationChange = (field, value) => {
    setNotifications((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePrivacyChange = (field, value) => {
    setPrivacy((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSecurityChange = (field, value) => {
    setSecurity((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveSettings = async (section) => {
    try {
      setLoading(true);
      const baseUrl = `/users/self`;
      if (section === "profile") {
        const resp = await apiClient.put(`${baseUrl}/profile`, {
          version: versions.profile,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          dateOfBirth: profileData.dateOfBirth || undefined,
          gender: profileData.gender,
          addressLine1: profileData.address,
          city: profileData.city,
          state: profileData.state,
          postalCode: profileData.zipCode,
          emergencyContactName: profileData.emergencyContact,
          emergencyContactPhone: profileData.emergencyPhone,
          weightKg: profileData.weightKg
            ? Number(profileData.weightKg)
            : undefined,
          heightCm: profileData.heightCm
            ? Number(profileData.heightCm)
            : undefined,
          bloodType: profileData.bloodType || undefined,
        });
        if (resp?.data?.profile?.version != null) {
          setVersions((v) => ({ ...v, profile: resp.data.profile.version }));
        }
      } else if (section === "medical") {
        const resp = await apiClient.put(`${baseUrl}/medical`, {
          version: versions.medical,
          bloodType:
            medicalData.bloodType || profileData.bloodType || undefined,
          allergies: medicalData.allergies
            ? medicalData.allergies
                .split(/[,\n]/)
                .map((a) => a.trim())
                .filter(Boolean)
            : [],
          currentMedications: medicalData.medications
            ? medicalData.medications
                .split(/[\n,]/)
                .map((a) => a.trim())
                .filter(Boolean)
            : [],
          medicalConditions: medicalData.medicalConditions
            ? medicalData.medicalConditions
                .split(/[,\n]/)
                .map((a) => a.trim())
                .filter(Boolean)
            : [],
        });
        if (resp?.data?.medical?.version != null) {
          setVersions((v) => ({ ...v, medical: resp.data.medical.version }));
        }
      } else if (section === "notifications") {
        const resp = await apiClient.put(`${baseUrl}/notifications`, {
          version: versions.notifications,
          appointmentReminders: notifications.appointmentReminders,
          medicationReminders: notifications.medicationReminders,
          healthContent: notifications.healthTips,
          marketing: notifications.marketingEmails,
          emailGeneral: notifications.emailNotifications,
          smsGeneral: notifications.smsNotifications,
        });
        if (resp?.data?.notifications?.version != null) {
          setVersions((v) => ({
            ...v,
            notifications: resp.data.notifications.version,
          }));
        }
      } else if (section === "privacy") {
        const resp = await apiClient.put(`${baseUrl}/privacy`, {
          version: versions.privacy,
          shareWithProviders: privacy.shareDataWithDoctors,
          shareAnonymizedResearch: privacy.allowDataAnalytics,
          shareWithInsurance: privacy.shareWithInsurance,
          publicProfileVisible: privacy.publicProfile,
        });
        if (resp?.data?.privacy?.version != null) {
          setVersions((v) => ({ ...v, privacy: resp.data.privacy.version }));
        }
      } else if (section === "security") {
        // Placeholder: implement password & 2FA forms separate from saveSettings
        await new Promise((r) => setTimeout(r, 300));
      }

      setSaveMessage(`${section} settings saved successfully!`);
      setTimeout(() => setSaveMessage(""), 3000);

      if (section === "security") {
        setSecurity((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      }
    } catch (error) {
      if (error?.response?.status === 409) {
        const latest = error.response.data.latest;
        if (section === "profile" && latest)
          setVersions((v) => ({ ...v, profile: latest.version }));
        if (section === "medical" && latest)
          setVersions((v) => ({ ...v, medical: latest.version }));
        if (section === "notifications" && latest)
          setVersions((v) => ({ ...v, notifications: latest.version }));
        if (section === "privacy" && latest)
          setVersions((v) => ({ ...v, privacy: latest.version }));
        setSaveMessage(
          "Version conflict: latest loaded. Re-apply your changes."
        );
        setTimeout(() => setSaveMessage(""), 4000);
      } else {
        setSaveMessage("Error saving settings. Please try again.");
      }
      console.error("Error saving settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!security.currentPassword || !security.newPassword) {
      setSaveMessage("Enter current and new password");
      setTimeout(() => setSaveMessage(""), 2500);
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      setSaveMessage("Password confirmation mismatch");
      setTimeout(() => setSaveMessage(""), 2500);
      return;
    }
    try {
      setLoading(true);
      await apiClient.put("/users/self/security/password", {
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
      });
      setSecurity((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setSaveMessage("Password updated");
      setTimeout(() => setSaveMessage(""), 2500);
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to change password";
      setSaveMessage(`Error: ${msg}`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };
  const update2FA = async () => {
    try {
      setLoading(true);
      const resp = await apiClient.put("/users/self/security/2fa", {
        enable: security.twoFactorAuth,
        type: security.twoFactorType || "App",
      });
      if (resp?.data?.security?.version != null) {
        setVersions((v) => ({ ...v, security: resp.data.security.version }));
      }
      setSaveMessage("Two-factor settings updated");
      setTimeout(() => setSaveMessage(""), 2500);
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to update 2FA";
      setSaveMessage(`Error: ${msg}`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Family helpers
  const refreshFamily = async () => {
    const res = await apiClient.get("/family");
    const fam = res.data;
    setFamily((prev) => ({
      ...prev,
      members: fam.members || [],
      group: fam.group || null,
    }));
  };
  const createHousehold = async () => {
    await apiClient.post("/family/groups");
    await refreshFamily();
  };
  const setActingAs = async (userId) => {
    await apiClient.patch("/family/acting-as", { userId });
    setFamily((prev) => ({ ...prev, actingAsUserId: userId || null }));
  };
  const removeMember = async (userId) => {
    if (!userId) return;
    try {
      setLoading(true);
      await apiClient.delete(`/family/members/${userId}`);
      await refreshFamily();
      setSaveMessage("Family member removed.");
      setTimeout(() => setSaveMessage(""), 2500);
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to remove member";
      setSaveMessage(`Error: ${msg}`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Insurance helpers
  const refreshInsurances = async () => {
    const res = await apiClient.get("/insurance");
    setInsurances(res?.data?.items || []);
  };
  const addInsurance = async () => {
    try {
      setLoading(true);
      await apiClient.post("/insurance", newInsurance);
      await refreshInsurances();
      setNewInsurance({
        provider: "",
        plan: "",
        memberId: "",
        policyNumber: "",
        groupNumber: "",
        isPrimary: false,
      });
      setSaveMessage("Insurance added.");
      setTimeout(() => setSaveMessage(""), 2500);
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to add insurance";
      setSaveMessage(`Error: ${msg}`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };
  const setPrimaryInsurance = async (id) => {
    try {
      setLoading(true);
      await apiClient.put(`/insurance/${id}`, { isPrimary: true });
      await refreshInsurances();
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to update insurance";
      setSaveMessage(`Error: ${msg}`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };
  const deleteInsurance = async (id) => {
    try {
      setLoading(true);
      await apiClient.delete(`/insurance/${id}`);
      await refreshInsurances();
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to delete insurance";
      setSaveMessage(`Error: ${msg}`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Payment helpers
  const refreshPayments = async () => {
    const res = await apiClient.get("/billing/methods");
    setPaymentMethods(res?.data?.items || []);
  };
  const addPaymentMethod = async () => {
    try {
      setLoading(true);
      await apiClient.post("/billing/methods", newPayment);
      await refreshPayments();
      setNewPayment({
        type: "card",
        brand: "",
        last4: "",
        expMonth: "",
        expYear: "",
        cardholderName: "",
        billingAddress: {
          line1: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
        isDefault: false,
      });
      setSaveMessage("Payment method added.");
      setTimeout(() => setSaveMessage(""), 2500);
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to add payment method";
      setSaveMessage(`Error: ${msg}`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };
  const setDefaultPayment = async (id) => {
    try {
      setLoading(true);
      await apiClient.put(`/billing/methods/${id}`, { isDefault: true });
      await refreshPayments();
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to update payment method";
      setSaveMessage(`Error: ${msg}`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };
  const deletePayment = async (id) => {
    try {
      setLoading(true);
      await apiClient.delete(`/billing/methods/${id}`);
      await refreshPayments();
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to delete payment method";
      setSaveMessage(`Error: ${msg}`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Pricing helpers
  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/pricing/services", {
        params: { region: pricingRegion, payerType: pricingPayerType },
      });
      setServices(res?.data?.items || []);
      if ((res?.data?.items || []).length && !selectedServiceCode) {
        setSelectedServiceCode(res.data.items[0].code);
      }
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to load services";
      setSaveMessage(`Error: ${msg}`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };
  const loadQuotes = async () => {
    try {
      const res = await apiClient.get("/pricing/quotes");
      setQuotes(res?.data?.items || []);
    } catch (e) {
      /* non-blocking */
    }
  };
  const loadPayments = async () => {
    try {
      const res = await apiClient.get("/checkout/payments");
      setPayments(res?.data?.items || []);
    } catch (e) {
      /* non-blocking */
    }
  };
  const loadInvoices = async () => {
    try {
      const res = await apiClient.get("/invoices");
      setInvoices(res?.data?.items || []);
    } catch (e) {
      /* non-blocking */
    }
  };
  const loadBanks = async () => {
    try {
      const res = await apiClient.get("/banks", {
        params: {
          country: bankCountry || pricingRegion,
          channel: "bank_transfer",
          search: bankSearch || undefined,
        },
      });
      setBanks(res?.data?.items || []);
    } catch (e) {
      // non-blocking
    }
  };

  // Auto-load services when entering Billing tab
  useEffect(() => {
    if (activeTab === "billing") {
      if (services.length === 0) loadServices();
      loadQuotes();
      loadPayments();
      loadInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  // Keep bank country aligned to pricing region initially
  useEffect(() => {
    setBankCountry(pricingRegion || "ET");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingRegion]);
  // When switching to bank method, fetch banks once
  useEffect(() => {
    if (activeTab === "billing" && checkoutMethod === "bank") {
      loadBanks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutMethod]);
  const createQuote = async () => {
    if (!selectedServiceCode) {
      setSaveMessage("Select a service first.");
      setTimeout(() => setSaveMessage(""), 2000);
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.post("/pricing/quote", {
        items: [{ serviceCode: selectedServiceCode, qty: Number(qty) || 1 }],
      });
      setQuote(res?.data?.quote || null);
      setIntent(null);
      setSaveMessage("Quote created.");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to create quote";
      setSaveMessage(`Error: ${msg}`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };
  const createCheckoutIntent = async () => {
    if (!quote) {
      setSaveMessage("Create a quote first.");
      setTimeout(() => setSaveMessage(""), 2000);
      return;
    }
    const amount =
      Number(quote?.patientResponsibility) || Number(quote?.subtotal) || 0;
    if (!amount) {
      setSaveMessage("Quote amount is zero.");
      setTimeout(() => setSaveMessage(""), 2000);
      return;
    }
    try {
      setLoading(true);
      // Map UI method values to backend enum
      const methodMap = {
        card: "Card",
        bank: "Bank",
        mobile: "MobileWallet",
      };
      const intentRes = await apiClient.post("/checkout/intents", {
        amount,
        currency: quote?.currency || "USD",
        method: methodMap[checkoutMethod] || "Card",
        provider:
          checkoutMethod === "bank"
            ? bankProvider
            : checkoutProvider || undefined,
        quoteId: quote?._id,
      });
      const created = intentRes?.data?.intent || null;
      setIntent(created);
      // Optional: trigger mobile wallet init
      if (
        created &&
        checkoutMethod === "mobile" &&
        checkoutProvider &&
        walletPhone
      ) {
        try {
          if (checkoutProvider === "mpesa") {
            await apiClient.post("/checkout/mpesa/stk-push", {
              intentId: created._id,
              phone: walletPhone,
            });
          } else if (checkoutProvider === "telebirr") {
            await apiClient.post("/checkout/telebirr/init", {
              intentId: created._id,
              phone: walletPhone,
            });
          }
        } catch (e2) {
          console.log("Mobile init failed", e2);
        }
      }
      // Optional: trigger bank init (send selected bank code or manual name)
      if (created && checkoutMethod === "bank") {
        try {
          let bankCode = selectedBankCode;
          if (!bankCode && selectedBankId) {
            const found = banks.find(
              (b) => String(b._id) === String(selectedBankId)
            );
            if (found) {
              const codes = found.providerCodes || {};
              bankCode =
                codes[bankProvider] ||
                found.shortCode ||
                found.centralBankCode ||
                found.swiftBIC ||
                found.name;
            }
          }
          if (!bankCode && bankNotListed) bankCode = manualBankName || "OTHER";
          if (bankCode) {
            await apiClient.post("/checkout/bank/init", {
              intentId: created._id,
              bankCode,
            });
          }
        } catch (e3) {
          console.log("Bank init failed", e3);
        }
      }
      setSaveMessage("Payment intent created.");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to create payment intent";
      setSaveMessage(`Error: ${msg}`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };
  const addMemberByEmail = async () => {
    if (!newMemberEmail) {
      setSaveMessage("Please enter an email.");
      setTimeout(() => setSaveMessage(""), 2500);
      return;
    }
    try {
      setLoading(true);
      await apiClient.post("/family/members/by-email", {
        email: newMemberEmail,
        role: newMemberRole,
      });
      setNewMemberEmail("");
      setNewMemberRole("adult");
      await refreshFamily();
      setSaveMessage("Family member added.");
      setTimeout(() => setSaveMessage(""), 2500);
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to add member";
      setSaveMessage(`Error: ${msg}`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "medical", label: "Medical Info", icon: "🏥" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "privacy", label: "Privacy", icon: "🔒" },
    { id: "security", label: "Security", icon: "🛡️" },
    { id: "family", label: "Family", icon: "👪" },
    { id: "billing", label: "Billing", icon: "💳" },
  ];

  return (
    <div className="patient-settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and information</p>
      </div>

      {saveMessage && (
        <div
          className={`save-message ${
            saveMessage.includes("Error") ? "error" : "success"
          }`}
        >
          {saveMessage}
        </div>
      )}

      <div className="settings-container">
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <div className="settings-section">
              <h2>Profile Information</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveSettings("profile");
                }}
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) =>
                        handleProfileChange("firstName", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) =>
                        handleProfileChange("lastName", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        handleProfileChange("email", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        handleProfileChange("phone", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) =>
                        handleProfileChange("dateOfBirth", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      value={profileData.gender}
                      onChange={(e) =>
                        handleProfileChange("gender", e.target.value)
                      }
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">
                        Prefer not to say
                      </option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      min={0}
                      value={profileData.weightKg || ""}
                      onChange={(e) =>
                        handleProfileChange("weightKg", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      min={0}
                      value={profileData.heightCm || ""}
                      onChange={(e) =>
                        handleProfileChange("heightCm", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Blood Type</label>
                    <select
                      value={profileData.bloodType || ""}
                      onChange={(e) =>
                        handleProfileChange("bloodType", e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (bt) => (
                          <option key={bt} value={bt}>
                            {bt}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <h3>Address Information</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Address</label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) =>
                        handleProfileChange("address", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={profileData.city}
                      onChange={(e) =>
                        handleProfileChange("city", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={profileData.state}
                      onChange={(e) =>
                        handleProfileChange("state", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      value={profileData.zipCode}
                      onChange={(e) =>
                        handleProfileChange("zipCode", e.target.value)
                      }
                    />
                  </div>
                </div>

                <h3>Emergency Contact</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Contact Name</label>
                    <input
                      type="text"
                      value={profileData.emergencyContact}
                      onChange={(e) =>
                        handleProfileChange("emergencyContact", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Phone</label>
                    <input
                      type="tel"
                      value={profileData.emergencyPhone}
                      onChange={(e) =>
                        handleProfileChange("emergencyPhone", e.target.value)
                      }
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </div>
          )}

          {/* Medical Information */}
          {activeTab === "medical" && (
            <div className="settings-section">
              <h2>Medical Information</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveSettings("medical");
                }}
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label>Blood Type</label>
                    <select
                      value={medicalData.bloodType}
                      onChange={(e) =>
                        handleMedicalChange("bloodType", e.target.value)
                      }
                    >
                      <option value="">Select Blood Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Primary Doctor</label>
                    <input
                      type="text"
                      value={medicalData.primaryDoctor}
                      onChange={(e) =>
                        handleMedicalChange("primaryDoctor", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Allergies</label>
                    <textarea
                      value={medicalData.allergies}
                      onChange={(e) =>
                        handleMedicalChange("allergies", e.target.value)
                      }
                      placeholder="List any allergies you have..."
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Current Medications</label>
                    <textarea
                      value={medicalData.medications}
                      onChange={(e) =>
                        handleMedicalChange("medications", e.target.value)
                      }
                      placeholder="List your current medications..."
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Medical Conditions</label>
                    <textarea
                      value={medicalData.medicalConditions}
                      onChange={(e) =>
                        handleMedicalChange("medicalConditions", e.target.value)
                      }
                      placeholder="List any medical conditions..."
                    />
                  </div>
                </div>

                <h3>Insurance</h3>
                <div style={{ marginBottom: 12 }}>
                  {(insurances || []).length === 0 ? (
                    <p>No insurance on file.</p>
                  ) : (
                    <ul>
                      {insurances.map((ins) => (
                        <li key={ins._id} style={{ marginBottom: 8 }}>
                          <span>
                            {ins.provider} {ins.plan ? `- ${ins.plan}` : ""}
                            {ins.policyNumber
                              ? ` (Policy ${ins.policyNumber})`
                              : ""}
                            {ins.isPrimary ? " • Primary" : ""}
                          </span>
                          {!ins.isPrimary && (
                            <button
                              style={{ marginLeft: 8 }}
                              onClick={() => setPrimaryInsurance(ins._id)}
                              disabled={loading}
                            >
                              Make Primary
                            </button>
                          )}
                          <button
                            className="danger-button"
                            style={{ marginLeft: 8 }}
                            onClick={() => deleteInsurance(ins._id)}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Provider</label>
                    <input
                      type="text"
                      value={newInsurance.provider}
                      onChange={(e) =>
                        setNewInsurance((p) => ({
                          ...p,
                          provider: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Plan</label>
                    <input
                      type="text"
                      value={newInsurance.plan}
                      onChange={(e) =>
                        setNewInsurance((p) => ({ ...p, plan: e.target.value }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Member ID</label>
                    <input
                      type="text"
                      value={newInsurance.memberId}
                      onChange={(e) =>
                        setNewInsurance((p) => ({
                          ...p,
                          memberId: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Policy Number</label>
                    <input
                      type="text"
                      value={newInsurance.policyNumber}
                      onChange={(e) =>
                        setNewInsurance((p) => ({
                          ...p,
                          policyNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Group Number</label>
                    <input
                      type="text"
                      value={newInsurance.groupNumber}
                      onChange={(e) =>
                        setNewInsurance((p) => ({
                          ...p,
                          groupNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newInsurance.isPrimary}
                        onChange={(e) =>
                          setNewInsurance((p) => ({
                            ...p,
                            isPrimary: e.target.checked,
                          }))
                        }
                      />
                      <span className="checkmark"></span>
                      Set as primary
                    </label>
                  </div>
                  <div className="form-group" style={{ alignSelf: "end" }}>
                    <button
                      type="button"
                      className="save-button"
                      onClick={addInsurance}
                      disabled={loading || !newInsurance.provider}
                    >
                      {loading ? "Adding..." : "Add Insurance"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Medical Info"}
                </button>
              </form>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveSettings("notifications");
                }}
              >
                <div className="notification-groups">
                  <div className="notification-group">
                    <h3>Appointment Notifications</h3>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notifications.appointmentReminders}
                          onChange={(e) =>
                            handleNotificationChange(
                              "appointmentReminders",
                              e.target.checked
                            )
                          }
                        />
                        <span className="checkmark"></span>
                        Appointment reminders
                      </label>
                    </div>
                  </div>

                  <div className="notification-group">
                    <h3>Communication Preferences</h3>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notifications.emailNotifications}
                          onChange={(e) =>
                            handleNotificationChange(
                              "emailNotifications",
                              e.target.checked
                            )
                          }
                        />
                        <span className="checkmark"></span>
                        Email notifications
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notifications.smsNotifications}
                          onChange={(e) =>
                            handleNotificationChange(
                              "smsNotifications",
                              e.target.checked
                            )
                          }
                        />
                        <span className="checkmark"></span>
                        SMS notifications
                      </label>
                    </div>
                  </div>

                  <div className="notification-group">
                    <h3>Health & Wellness</h3>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notifications.medicationReminders}
                          onChange={(e) =>
                            handleNotificationChange(
                              "medicationReminders",
                              e.target.checked
                            )
                          }
                        />
                        <span className="checkmark"></span>
                        Medication reminders
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notifications.healthTips}
                          onChange={(e) =>
                            handleNotificationChange(
                              "healthTips",
                              e.target.checked
                            )
                          }
                        />
                        <span className="checkmark"></span>
                        Health tips and articles
                      </label>
                    </div>
                  </div>

                  <div className="notification-group">
                    <h3>Marketing</h3>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notifications.marketingEmails}
                          onChange={(e) =>
                            handleNotificationChange(
                              "marketingEmails",
                              e.target.checked
                            )
                          }
                        />
                        <span className="checkmark"></span>
                        Marketing emails and promotions
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Preferences"}
                </button>
              </form>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === "privacy" && (
            <div className="settings-section">
              <h2>Privacy Settings</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveSettings("privacy");
                }}
              >
                <div className="privacy-groups">
                  <div className="privacy-group">
                    <h3>Data Sharing</h3>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={privacy.shareDataWithDoctors}
                          onChange={(e) =>
                            handlePrivacyChange(
                              "shareDataWithDoctors",
                              e.target.checked
                            )
                          }
                        />
                        <span className="checkmark"></span>
                        Share medical data with healthcare providers
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={privacy.allowDataAnalytics}
                          onChange={(e) =>
                            handlePrivacyChange(
                              "allowDataAnalytics",
                              e.target.checked
                            )
                          }
                        />
                        <span className="checkmark"></span>
                        Allow anonymized data for analytics and research
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={privacy.shareWithInsurance}
                          onChange={(e) =>
                            handlePrivacyChange(
                              "shareWithInsurance",
                              e.target.checked
                            )
                          }
                        />
                        <span className="checkmark"></span>
                        Share relevant data with insurance providers
                      </label>
                    </div>
                  </div>

                  <div className="privacy-group">
                    <h3>Profile Visibility</h3>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={privacy.publicProfile}
                          onChange={(e) =>
                            handlePrivacyChange(
                              "publicProfile",
                              e.target.checked
                            )
                          }
                        />
                        <span className="checkmark"></span>
                        Make profile visible to other patients (name and general
                        info only)
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Privacy Settings"}
                </button>
              </form>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="settings-section">
              <h2>Security Settings</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveSettings("security");
                }}
              >
                <div className="security-groups">
                  <div className="security-group">
                    <h3>Change Password</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Current Password</label>
                        <input
                          type="password"
                          value={security.currentPassword}
                          onChange={(e) =>
                            handleSecurityChange(
                              "currentPassword",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>New Password</label>
                        <input
                          type="password"
                          value={security.newPassword}
                          onChange={(e) =>
                            handleSecurityChange("newPassword", e.target.value)
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                          type="password"
                          value={security.confirmPassword}
                          onChange={(e) =>
                            handleSecurityChange(
                              "confirmPassword",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="security-group">
                    <h3>Two-Factor Authentication</h3>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={security.twoFactorAuth}
                          onChange={(e) =>
                            handleSecurityChange(
                              "twoFactorAuth",
                              e.target.checked
                            )
                          }
                        />
                        <span className="checkmark"></span>
                        Enable two-factor authentication for additional security
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Update Security"}
                </button>
              </form>
            </div>
          )}

          {/* Family Settings */}
          {activeTab === "family" && (
            <div className="settings-section">
              <h2>Family & Household</h2>
              {!family.group ? (
                <>
                  <p>You don't have a household yet.</p>
                  <button
                    className="save-button"
                    disabled={loading}
                    onClick={createHousehold}
                  >
                    {loading ? "Working..." : "Create Household"}
                  </button>
                </>
              ) : (
                <>
                  <p>Household: {family.group.name}</p>
                  <div className="form-grid" style={{ marginBottom: 16 }}>
                    <div className="form-group">
                      <label>Add member by email</label>
                      <input
                        type="email"
                        placeholder="member@example.com"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Role</label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                      >
                        <option value="adult">Adult (Spouse/Partner)</option>
                        <option value="dependent">Dependent (Child)</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ alignSelf: "end" }}>
                      <button
                        type="button"
                        className="save-button"
                        onClick={addMemberByEmail}
                        disabled={loading}
                      >
                        {loading ? "Adding..." : "Add Member"}
                      </button>
                    </div>
                  </div>
                  <h3>Members</h3>
                  <ul>
                    {(family.members || []).map((m) => (
                      <li key={m.userId?._id || m.userId}>
                        <span>
                          {m.userId?.profile?.firstName}{" "}
                          {m.userId?.profile?.lastName} ({m.userId?.email}) -{" "}
                          {m.role}
                        </span>
                        <button
                          style={{ marginLeft: 8 }}
                          onClick={() => setActingAs(m.userId?._id || m.userId)}
                          disabled={
                            family.actingAsUserId ===
                            (m.userId?._id || m.userId)
                          }
                        >
                          {family.actingAsUserId === (m.userId?._id || m.userId)
                            ? "Acting As"
                            : "Act as this member"}
                        </button>
                        {m.role !== "owner" && (
                          <button
                            style={{ marginLeft: 8 }}
                            className="danger-button"
                            onClick={() =>
                              removeMember(m.userId?._id || m.userId)
                            }
                            disabled={loading}
                          >
                            Remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="save-button"
                    onClick={() => setActingAs(null)}
                  >
                    Stop Acting As
                  </button>
                </>
              )}
            </div>
          )}

          {/* Billing */}
          {activeTab === "billing" && (
            <div className="settings-section">
              <h2>Billing & Payment Methods</h2>
              <div style={{ marginBottom: 12 }}>
                {(paymentMethods || []).length === 0 ? (
                  <p>No payment methods on file.</p>
                ) : (
                  <ul>
                    {paymentMethods.map((pm) => (
                      <li key={pm._id} style={{ marginBottom: 8 }}>
                        <span>
                          {pm.type?.toUpperCase()} {pm.brand} •••• {pm.last4}
                          {pm.expMonth && pm.expYear
                            ? ` exp ${pm.expMonth}/${pm.expYear}`
                            : ""}
                          {pm.isDefault ? " • Default" : ""}
                        </span>
                        {!pm.isDefault && (
                          <button
                            style={{ marginLeft: 8 }}
                            onClick={() => setDefaultPayment(pm._id)}
                            disabled={loading}
                          >
                            Make Default
                          </button>
                        )}
                        <button
                          className="danger-button"
                          style={{ marginLeft: 8 }}
                          onClick={() => deletePayment(pm._id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <h3>Add Payment Method</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={newPayment.type}
                    onChange={(e) =>
                      setNewPayment((p) => ({ ...p, type: e.target.value }))
                    }
                  >
                    <option value="card">Card</option>
                    <option value="bank">Bank</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    value={newPayment.brand}
                    onChange={(e) =>
                      setNewPayment((p) => ({ ...p, brand: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Last 4</label>
                  <input
                    type="text"
                    value={newPayment.last4}
                    onChange={(e) =>
                      setNewPayment((p) => ({ ...p, last4: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Exp Month</label>
                  <input
                    type="text"
                    value={newPayment.expMonth}
                    onChange={(e) =>
                      setNewPayment((p) => ({ ...p, expMonth: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Exp Year</label>
                  <input
                    type="text"
                    value={newPayment.expYear}
                    onChange={(e) =>
                      setNewPayment((p) => ({ ...p, expYear: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Cardholder Name</label>
                  <input
                    type="text"
                    value={newPayment.cardholderName}
                    onChange={(e) =>
                      setNewPayment((p) => ({
                        ...p,
                        cardholderName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group full-width">
                  <label>Billing Address</label>
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={newPayment.billingAddress.line1}
                    onChange={(e) =>
                      setNewPayment((p) => ({
                        ...p,
                        billingAddress: {
                          ...p.billingAddress,
                          line1: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={newPayment.billingAddress.city}
                    onChange={(e) =>
                      setNewPayment((p) => ({
                        ...p,
                        billingAddress: {
                          ...p.billingAddress,
                          city: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={newPayment.billingAddress.state}
                    onChange={(e) =>
                      setNewPayment((p) => ({
                        ...p,
                        billingAddress: {
                          ...p.billingAddress,
                          state: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    value={newPayment.billingAddress.postalCode}
                    onChange={(e) =>
                      setNewPayment((p) => ({
                        ...p,
                        billingAddress: {
                          ...p.billingAddress,
                          postalCode: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={newPayment.billingAddress.country}
                    onChange={(e) =>
                      setNewPayment((p) => ({
                        ...p,
                        billingAddress: {
                          ...p.billingAddress,
                          country: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newPayment.isDefault}
                      onChange={(e) =>
                        setNewPayment((p) => ({
                          ...p,
                          isDefault: e.target.checked,
                        }))
                      }
                    />
                    <span className="checkmark"></span>
                    Set as default
                  </label>
                </div>
                <div className="form-group" style={{ alignSelf: "end" }}>
                  <button
                    type="button"
                    className="save-button"
                    onClick={addPaymentMethod}
                    disabled={loading || !newPayment.brand || !newPayment.last4}
                  >
                    {loading ? "Adding..." : "Add Payment Method"}
                  </button>
                </div>
              </div>

              <h3 style={{ marginTop: 24 }}>Quick Quote & Checkout (Demo)</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Region</label>
                  <input
                    type="text"
                    value={pricingRegion}
                    onChange={(e) => setPricingRegion(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Payer Type</label>
                  <input
                    type="text"
                    value={pricingPayerType}
                    onChange={(e) => setPricingPayerType(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ alignSelf: "end" }}>
                  <button
                    type="button"
                    className="save-button"
                    onClick={loadServices}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load Services"}
                  </button>
                </div>
              </div>
              {services.length > 0 && (
                <div className="form-grid" style={{ marginTop: 8 }}>
                  <div className="form-group">
                    <label>Service</label>
                    <select
                      value={selectedServiceCode}
                      onChange={(e) => setSelectedServiceCode(e.target.value)}
                    >
                      {services.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} — {s.name} ({s.currency} {s.price})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ alignSelf: "end" }}>
                    <button
                      type="button"
                      className="save-button"
                      onClick={createQuote}
                      disabled={loading || !selectedServiceCode}
                    >
                      {loading ? "Working..." : "Create Quote"}
                    </button>
                  </div>
                </div>
              )}

              {quote && (
                <div style={{ marginTop: 12 }}>
                  <p>
                    Quote: Subtotal {quote.currency} {quote.subtotal} •
                    Estimated Insurance {quote.currency}{" "}
                    {quote.estimatedInsurance} • You Pay {quote.currency}{" "}
                    {quote.patientResponsibility}
                  </p>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Method</label>
                      <select
                        value={checkoutMethod}
                        onChange={(e) => setCheckoutMethod(e.target.value)}
                      >
                        <option value="card">Card</option>
                        <option value="bank">Bank</option>
                        <option value="mobile">Mobile Wallet</option>
                      </select>
                    </div>
                    {checkoutMethod === "bank" && (
                      <>
                        <div className="form-group">
                          <label>Country</label>
                          <input
                            type="text"
                            placeholder="e.g. ET, KE, NG"
                            value={bankCountry}
                            onChange={(e) =>
                              setBankCountry(e.target.value.toUpperCase())
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Provider/Aggregator</label>
                          <select
                            value={bankProvider}
                            onChange={(e) => setBankProvider(e.target.value)}
                          >
                            <option value="paystack">Paystack</option>
                            <option value="flutterwave">Flutterwave</option>
                            <option value="dpo">DPO</option>
                            <option value="cellulant">Cellulant</option>
                            <option value="chapa">Chapa</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Search Bank</label>
                          <input
                            type="text"
                            placeholder="Search name (e.g. Equity, KCB)"
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                          />
                        </div>
                        <div
                          className="form-group"
                          style={{ alignSelf: "end" }}
                        >
                          <button
                            type="button"
                            className="save-button"
                            onClick={loadBanks}
                            disabled={loading}
                          >
                            {loading ? "Loading..." : "Find Banks"}
                          </button>
                        </div>
                        <div className="form-group full-width">
                          <label>Pick Your Bank</label>
                          {banks.length === 0 ? (
                            <p>No banks found. You can enter manually below.</p>
                          ) : (
                            <select
                              value={selectedBankId}
                              onChange={(e) => {
                                setSelectedBankId(e.target.value);
                                setBankNotListed(false);
                                setSelectedBankCode("");
                              }}
                            >
                              <option value="">Select a bank</option>
                              {banks.map((b) => (
                                <option key={b._id} value={b._id}>
                                  {b.name} ({b.countryIso2})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="form-group full-width">
                          <label>
                            <input
                              type="checkbox"
                              checked={bankNotListed}
                              onChange={(e) => {
                                setBankNotListed(e.target.checked);
                                if (e.target.checked) {
                                  setSelectedBankId("");
                                }
                              }}
                            />
                            <span style={{ marginLeft: 8 }}>
                              My bank is not listed
                            </span>
                          </label>
                        </div>
                        {bankNotListed ? (
                          <div className="form-group full-width">
                            <label>Enter Bank Name</label>
                            <input
                              type="text"
                              placeholder="Your Bank Name"
                              value={manualBankName}
                              onChange={(e) =>
                                setManualBankName(e.target.value)
                              }
                            />
                          </div>
                        ) : (
                          <div className="form-group full-width">
                            <label>Bank Code (optional override)</label>
                            <input
                              type="text"
                              placeholder="Override provider bank code if needed"
                              value={selectedBankCode}
                              onChange={(e) =>
                                setSelectedBankCode(e.target.value)
                              }
                            />
                          </div>
                        )}
                      </>
                    )}
                    {checkoutMethod === "mobile" && (
                      <>
                        <div className="form-group">
                          <label>Provider</label>
                          <select
                            value={checkoutProvider}
                            onChange={(e) =>
                              setCheckoutProvider(e.target.value)
                            }
                          >
                            <option value="">Select</option>
                            <option value="mpesa">M-Pesa</option>
                            <option value="telebirr">Telebirr</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Phone</label>
                          <input
                            type="tel"
                            placeholder="e.g. +2547..."
                            value={walletPhone}
                            onChange={(e) => setWalletPhone(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    <div className="form-group" style={{ alignSelf: "end" }}>
                      <button
                        type="button"
                        className="save-button"
                        onClick={createCheckoutIntent}
                        disabled={loading}
                      >
                        {loading ? "Working..." : "Create Checkout Intent"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quotes List */}
              <h3 style={{ marginTop: 24 }}>Your Quotes</h3>
              {quotes.length === 0 ? (
                <p>No quotes yet.</p>
              ) : (
                <ul>
                  {quotes.map((q) => (
                    <li key={q._id}>
                      <span>
                        {new Date(q.createdAt).toLocaleString()} • {q.currency}{" "}
                        {q.patientResponsibility || q.subtotal} •{" "}
                        {q.items?.[0]?.name || q.items?.[0]?.serviceCode} (+
                        {(q.items?.length || 1) - 1} more)
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Payments List */}
              <h3 style={{ marginTop: 16 }}>Payments</h3>
              {payments.length === 0 ? (
                <p>No payments yet.</p>
              ) : (
                <ul>
                  {payments.map((p) => (
                    <li key={p._id}>
                      <span>
                        {new Date(p.createdAt).toLocaleString()} • {p.currency}{" "}
                        {p.amount} • {p.method} • {p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Invoices List */}
              <h3 style={{ marginTop: 16 }}>Invoices</h3>
              {invoices.length === 0 ? (
                <p>No invoices yet.</p>
              ) : (
                <ul>
                  {invoices.map((inv) => (
                    <li key={inv._id}>
                      <span>
                        {new Date(inv.createdAt).toLocaleString()} •{" "}
                        {inv.currency} {inv.total} • {inv.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientSettingsPage;
