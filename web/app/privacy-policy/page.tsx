export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <section className="mb-6">
        <p className="text-gray-600 mb-4">Last updated: October 5, 2025</p>
        
        <h2 className="text-2xl font-semibold mb-3">1. Data Collection</h2>
        <p className="mb-4">AI SME Copilot collects the following data:</p>
        <ul className="list-disc ml-6 mt-2 space-y-2">
          <li>Facebook/Instagram account information (name, email, profile picture)</li>
          <li>Business page information and access tokens</li>
          <li>Post analytics and engagement data</li>
          <li>User profile and organization details</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. Data Usage</h2>
        <p className="mb-4">We use your data to:</p>
        <ul className="list-disc ml-6 mt-2 space-y-2">
          <li>Display your social media analytics and insights</li>
          <li>Manage and schedule your social media posts</li>
          <li>Provide business intelligence and reporting</li>
          <li>Improve our services and user experience</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. Data Storage</h2>
        <p className="mb-4">Your data is securely stored using Supabase infrastructure with industry-standard encryption.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. Data Sharing</h2>
        <p className="mb-4">We do not share your personal data with third parties except:</p>
        <ul className="list-disc ml-6 mt-2 space-y-2">
          <li>When required by law</li>
          <li>With your explicit consent</li>
          <li>To provide the services you requested</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Data Deletion</h2>
        <p className="mb-4">
          You can request data deletion at any time by visiting our{' '}
          <a href="/data-deletion" className="text-blue-600 underline hover:text-blue-800">
            data deletion page
          </a>.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">6. Contact Information</h2>
        <p className="mb-4">
          For privacy-related questions or concerns, contact us at:{' '}
          <a href="mailto:amangu89@gmail.com" className="text-blue-600 underline hover:text-blue-800">
            amangu89@gmail.com
          </a>
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">7. Changes to Privacy Policy</h2>
        <p className="mb-4">
          We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
        </p>
      </section>
    </div>
  )
}
