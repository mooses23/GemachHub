export default function Rules() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Our Rules
            </h1>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-3">
                  Deposit Policy
                </h2>
                <p className="text-blue-800">
                  A $20 deposit is required when borrowing Baby Banz Earmuffs. This deposit is fully refundable when the earmuffs are returned in good condition.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-400 p-6">
                <h2 className="text-xl font-semibold text-green-900 mb-3">
                  Borrowing Period
                </h2>
                <p className="text-green-800">
                  Earmuffs may be borrowed for up to 2 weeks. Extensions may be available upon request if inventory allows.
                </p>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-6">
                <h2 className="text-xl font-semibold text-amber-900 mb-3">
                  Care Instructions
                </h2>
                <ul className="text-amber-800 space-y-2">
                  <li>• Keep earmuffs clean and dry</li>
                  <li>• Store in provided case when not in use</li>
                  <li>• Handle with care to avoid damage</li>
                  <li>• Do not disassemble or modify the earmuffs</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-6">
                <h2 className="text-xl font-semibold text-red-900 mb-3">
                  Return Policy
                </h2>
                <ul className="text-red-800 space-y-2">
                  <li>• Return earmuffs to the same location where borrowed</li>
                  <li>• Inspect earmuffs for damage before returning</li>
                  <li>• Lost or damaged items may result in deposit forfeiture</li>
                  <li>• Contact location coordinator if return is delayed</li>
                </ul>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-6">
                <h2 className="text-xl font-semibold text-purple-900 mb-3">
                  Responsibility
                </h2>
                <p className="text-purple-800">
                  Borrowers are responsible for the safe care and timely return of borrowed earmuffs. By borrowing from our gemach, you agree to these terms and conditions.
                </p>
              </div>

              <div className="text-center mt-8 pt-6 border-t border-gray-200">
                <p className="text-gray-600">
                  Questions about these rules? <a href="/contact" className="text-primary hover:underline">Contact us</a> for clarification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}