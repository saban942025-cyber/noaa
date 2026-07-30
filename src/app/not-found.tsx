import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 dir-rtl text-right">
      <h2 className="text-3xl font-bold mb-4">404 - העמוד לא נמצא</h2>
      <p className="text-gray-400 mb-6">מצטערים, העמוד שחיפשת אינו קיים או שהועבר ממקומו.</p>
      <Link 
        href="/"
        className="px-6 py-3 bg-saban-gold text-black font-bold rounded-xl hover:bg-white transition-colors"
      >
        חזרה לדף הבית
      </Link>
    </div>
  );
}
