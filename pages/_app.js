import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { ChatProvider } from '../contexts/ChatContext';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <Component {...pageProps} />
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
