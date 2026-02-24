import './globals.css';

export const metadata = {
  title: 'Tolun Logistics',
  description: 'Logistics Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
