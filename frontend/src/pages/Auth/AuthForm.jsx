import { Children, cloneElement } from 'react';

export default function AuthForm({ children, onSubmit }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {Children.map(children, (child) => {
        if (child.type === Input) {
          return cloneElement(child, {
            className: `auth-input ${child.props.className || ''}`
          });
        }
        return child;
      })}
    </form>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input {...props} />
    </div>
  );
}

AuthForm.Input = Input;