export function VariantB() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute -top-32 -left-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />

      {/* Dedication Banner */}
      <div className="relative overflow-hidden border-b border-amber-500/15 bg-gradient-to-r from-slate-900/60 via-amber-950/40 to-slate-900/60">
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.18),transparent_70%)]" />
        <div className="relative py-3 px-4 md:px-8 text-center">
          <p className="text-lg md:text-xl font-serif text-amber-200 tracking-wide drop-shadow-sm" dir="rtl">
            לעילוי נשמת מרת רבקה בת ר׳ מרדכי דוד ע"ה
          </p>
          <p className="text-xs text-amber-300/70 mt-0.5 tracking-widest uppercase" style={{ letterSpacing: '0.15em' }}>
            Her story — opened below
          </p>
        </div>
      </div>

      {/* Story panel — always expanded under banner */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 pt-6 pb-2">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-amber-500/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-500/30 to-amber-500/30" />
            </div>
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(15,20,35,0.80) 0%, rgba(40,30,15,0.78) 100%)',
                border: '1px solid rgba(251,191,36,0.14)',
                boxShadow: '0 0 40px rgba(251,191,36,0.06), inset 0 1px 0 rgba(251,191,36,0.10)',
              }}
            >
              <div className="relative px-6 py-6 md:px-10 md:py-8 space-y-3">
                <p className="font-serif text-sm md:text-base text-amber-100/90 leading-relaxed tracking-wide">
                  In loving memory of <span className="text-amber-200">Rivka bas Mordechai Dovid</span>{' '}
                  <span className="text-amber-300/80 text-xs align-super">a"h</span>, our founder's mother,
                  whose kindness lives on in every pair of earmuffs lent to a family in need.
                </p>
                <p className="font-serif text-sm md:text-base text-slate-300/75 leading-relaxed tracking-wide">
                  She believed every baby deserved the chance to sleep through life's noise — a wedding, a siren, a brother's birthday.
                </p>
                <p className="font-serif text-sm md:text-base text-amber-200/80 leading-relaxed italic tracking-wide">
                  May her memory be a blessing, and may these earmuffs bring quiet to many more.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-amber-500/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-500/30 to-amber-500/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section — larger warm-framed real photo */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="text-center max-w-4xl mx-auto mb-10 md:mb-14">
            <div className="mb-8">
              <div className="relative inline-block">
                {/* Warm halo */}
                <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full scale-150" />
                <div
                  className="relative w-56 h-56 md:w-72 md:h-72 mx-auto rounded-3xl overflow-hidden"
                  style={{
                    boxShadow: '0 25px 60px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(251,191,36,0.20), 0 0 40px rgba(251,191,36,0.08)',
                  }}
                >
                  <picture>
                    <source
                      type="image/webp"
                      srcSet="/__mockup/images/heroB-384.webp 384w, /__mockup/images/heroB-640.webp 640w, /__mockup/images/heroB-1024.webp 1024w"
                      sizes="(max-width: 768px) 224px, 288px"
                    />
                    <img
                      src="/__mockup/images/heroB-640.jpg"
                      srcSet="/__mockup/images/heroB-384.jpg 384w, /__mockup/images/heroB-640.jpg 640w, /__mockup/images/heroB-1024.jpg 1024w"
                      sizes="(max-width: 768px) 224px, 288px"
                      alt="Founder's mother with her grandchild wearing Baby Banz earmuffs"
                      className="w-full h-full object-cover"
                    />
                  </picture>
                </div>
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-5 md:mb-7 leading-tight">
              Find baby earmuffs near you
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
              Borrow noise-cancelling earmuffs for your baby — free of charge, returnable to any participating gemach worldwide.
            </p>
          </div>

          <div className="rounded-3xl p-5 md:p-10 max-w-6xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10">
            <div className="h-14 rounded-xl bg-white/5 border border-white/10 flex items-center px-4 text-slate-400">
              Search by city or zip code…
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
