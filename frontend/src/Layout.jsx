import Header from './Header';
import Footer from './Footer';
import NotificationBar from '../notification/NotificationBar';

export default function Layout({ children }) {
  return (
    <div className="app-container">
      <Header />
      <NotificationBar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}