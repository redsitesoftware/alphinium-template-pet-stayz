import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext({ session: null });

function AuthProvider({ children, config }) {
  const [session] = useState(null);
  return React.createElement(AuthContext.Provider, { value: { session } }, children);
}

function useAuth() {
  return useContext(AuthContext);
}

function createAuthConfig(options) {
  return options || {};
}

export { AuthContext, AuthProvider, useAuth, createAuthConfig };
