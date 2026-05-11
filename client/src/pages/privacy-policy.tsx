import { useEffect } from "react";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | Baby Banz Earmuffs Gemach";
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 py-10 sm:py-14">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Privacy Policy</h1>
        <p className="text-sm text-neutral-500 mb-8">
          We keep things simple. Here's what we collect and how we use it.
        </p>

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-6 text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">What We Collect</h2>
            <p>
              When you reach out, request earmuffs, or open a Gemach with us, we collect basic
              information such as your name, phone number, email address, request details, and
              our communication history with you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">How We Use It</h2>
            <p>
              We use this information only to help manage Gemach requests, pickups, returns,
              onboarding new locations, and providing support. That's it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">What We Don't Do</h2>
            <p>
              We do not sell your personal information. SMS consent and phone numbers are not
              shared with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">Text Messages</h2>
            <p>
              If you've shared your phone number with us, you can stop receiving text messages
              at any time by replying <strong>STOP</strong>. Reply <strong>HELP</strong> if you
              need assistance. See our{" "}
              <a href="/sms-policy" className="text-primary hover:underline">
                SMS Policy
              </a>{" "}
              for more detail.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">Questions?</h2>
            <p>
              Email us anytime at{" "}
              <a href="mailto:earmuffsgemach@gmail.com" className="text-primary hover:underline">
                earmuffsgemach@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
