import "./globals.css";
import { VoiceProvider } from "@/context/VoiceContext";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ToastProvider } from "@/context/ToastContext";
import { GestureProvider } from "@/context/GestureContext";
import VirtualCursor from "@/components/VirtualCursor";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import Layout from "@/components/Layout";

import { ThemeProvider } from "@/components/ThemeProvider";
import { GoogleOAuthProvider } from '@react-oauth/google';

const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const metadata = {
  title: "VoiceShop - Accessible E-commerce",
  description: "A fully voice-controlled e-commerce platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy'}>
            <VoiceProvider>
              <GestureProvider>
                <AuthProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <ToastProvider>
                        <VirtualCursor />
                        <VoiceVisualizer />
                        <Layout>
                          {children}
                        </Layout>
                      </ToastProvider>
                    </WishlistProvider>
                  </CartProvider>
                </AuthProvider>
              </GestureProvider>
            </VoiceProvider>
          </GoogleOAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
