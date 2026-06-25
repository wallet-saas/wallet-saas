/**
 * Stamply — Page Analytics Admin
 * 
 * Dashboard analytics avancé style Whop
 * Accessible via /admin/analytics
 */

import Head from 'next/head';
import AnalyticsDashboard from './analytics';

export default function AdminAnalyticsPage() {
  return (
    <>
      <Head>
        <title>Analytics — Stamply Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <AnalyticsDashboard />
        </div>
      </div>
    </>
  );
}
