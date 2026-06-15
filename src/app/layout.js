import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Luxe & Co. CRM — AI-Native Mini CRM",
  description: "AI-powered CRM for reaching shoppers through personalised campaigns across WhatsApp, SMS, Email and RCS.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>


        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
