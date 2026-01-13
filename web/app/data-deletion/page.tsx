export default function DataDeletion() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Data Deletion Instructions</h1>
      
      <section className="mb-6">
        <p className="text-gray-600 mb-4">
          We respect your right to privacy and data control. Follow the instructions below to delete your data from AI SME Copilot.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Method 1: Through Your Account</h2>
        <ol className="list-decimal ml-6 mt-2 space-y-3">
          <li>Log in to your AI SME Copilot account at <a href="https://touchnsearch.com" className="text-blue-600 underline">touchnsearch.com</a></li>
          <li>Navigate to <strong>Settings</strong> → <strong>Account Settings</strong></li>
          <li>Scroll down to the <strong>Danger Zone</strong> section</li>
          <li>Click on <strong>&ldquo;Delete Account&rdquo;</strong></li>
          <li>Confirm your decision by entering your password</li>
          <li>Click <strong>&ldquo;Permanently Delete My Account&rdquo;</strong></li>
        </ol>
        <p className="mt-4 text-sm text-gray-600">
          ⏱️ Your data will be permanently deleted within 48 hours.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Method 2: Email Request</h2>
        <p className="mb-4">If you cannot access your account, send an email to:</p>
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <p className="font-semibold">Email: <a href="mailto:amangu89@gmail.com" className="text-blue-600 underline">amangu89@gmail.com</a></p>
          <p className="mt-2">Subject: <strong>Data Deletion Request</strong></p>
          <p className="mt-2">Include in your email:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Your registered email address</li>
            <li>Your full name</li>
            <li>Reason for deletion (optional)</li>
          </ul>
        </div>
        <p className="text-sm text-gray-600">
          ⏱️ We will process your request within 30 business days and send you a confirmation email.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">What Data Gets Deleted</h2>
        <p className="mb-4">When you delete your account, the following data will be permanently removed:</p>
        <ul className="list-disc ml-6 mt-2 space-y-2">
          <li>Your profile information (name, email, phone number)</li>
          <li>Connected social media account credentials and tokens</li>
          <li>All analytics and performance data</li>
          <li>Post history and scheduled posts</li>
          <li>Organization and team member data</li>
          <li>All files and documents uploaded to the platform</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Data Retention</h2>
        <p className="mb-4">
          After deletion, we may retain certain information for legal compliance purposes, such as:
        </p>
        <ul className="list-disc ml-6 mt-2 space-y-2">
          <li>Transaction records (for tax and accounting purposes) - retained for 7 years</li>
          <li>Logs required by law enforcement - retained as legally required</li>
        </ul>
        <p className="mt-4 text-sm text-gray-600">
          This retained data is anonymized and cannot be used to identify you personally.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Disconnecting Social Media Accounts</h2>
        <p className="mb-4">
          To revoke AI SME Copilot&apos;s access to your Facebook/Instagram accounts:
        </p>
        <ol className="list-decimal ml-6 mt-2 space-y-2">
          <li>Go to Facebook Settings → <strong>Apps and Websites</strong></li>
          <li>Find <strong>&ldquo;AI SME Copilot&rdquo;</strong> in the list</li>
          <li>Click <strong>&ldquo;Remove&rdquo;</strong></li>
          <li>Confirm the removal</li>
        </ol>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Questions or Concerns?</h2>
        <p className="mb-4">
          If you have any questions about data deletion, please contact us:
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p>📧 Email: <a href="mailto:amangu89@gmail.com" className="text-blue-600 underline font-semibold">amangu89@gmail.com</a></p>
          <p className="mt-2 text-sm text-gray-600">We typically respond within 24-48 hours.</p>
        </div>
      </section>
    </div>
  )
}
