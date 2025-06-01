import { BorrowForm } from "@/components/transactions/borrow-form";

export default function Borrow() {
  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Borrow Baby Banz Earmuffs</h1>
            <p className="text-muted-foreground text-lg">
              Protect your baby's hearing at events with our gemach service. 
              Record your deposit below when picking up earmuffs.
            </p>
          </div>
          
          <BorrowForm />
          
          <div className="mt-12 bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">How Our Gemach Works</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-primary mb-2">1. Find a Location</h3>
                <p className="text-sm text-muted-foreground">
                  Choose from our network of gemach locations worldwide. Each location maintains sanitized earmuffs ready for lending.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-primary mb-2">2. Pay Deposit</h3>
                <p className="text-sm text-muted-foreground">
                  Pay a refundable $20 deposit when picking up the earmuffs. This form records your transaction for easy processing.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-primary mb-2">3. Use & Return</h3>
                <p className="text-sm text-muted-foreground">
                  Use the earmuffs at your event and return them by the expected date in good condition.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-primary mb-2">4. Get Refund</h3>
                <p className="text-sm text-muted-foreground">
                  The gemach operator will process your return and refund your full $20 deposit immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}