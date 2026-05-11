import { useEffect } from "react";

export default function Terms() {
  useEffect(() => {
    document.title = "Terms | Baby Banz Earmuffs Gemach";
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 py-10 sm:py-14">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Terms</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Friendly terms so everyone knows what to expect.
        </p>

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-6 text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">A Community Service</h2>
            <p>
              The Gemach provides Baby Banz noise-cancelling earmuffs as a community service to
              help protect infants' hearing. There's no fee — just a small refundable deposit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">Borrowing & Returning</h2>
            <p>
              Please return borrowed items on time and in good condition. If something comes up
              and you need more time, just let us know — we're happy to work with you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">How We Use Text Messages</h2>
            <p>
              We may send text messages for things like request updates, pickup notifications,
              return reminders, onboarding new Gemach locations, and support. Message frequency
              varies based on your activity. Message and data rates may apply.
            </p>
            <p className="mt-2">
              Reply <strong>STOP</strong> to opt out at any time. Reply <strong>HELP</strong> if
              you need help. For more detail, see our{" "}
              <a href="/sms-policy" className="text-primary hover:underline">
                SMS Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">Privacy</h2>
            <p>
              Please read our{" "}
              <a href="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </a>{" "}
              to see how we handle your information.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
