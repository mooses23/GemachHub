import { SelfDeposit } from "@/components/home/self-deposit";

export default function SelfDepositPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Self Deposit
            </h1>
            <p className="text-lg text-gray-600">
              Record your $20 deposit when borrowing Baby Banz Earmuffs from any location
            </p>
          </div>
          
          <SelfDeposit />
        </div>
      </div>
    </div>
  );
}