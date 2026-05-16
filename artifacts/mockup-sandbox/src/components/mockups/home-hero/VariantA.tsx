export function VariantA() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute -top-32 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />

      {/* Dedication Banner */}
      <div className="relative overflow-hidden border-b border-amber-500/10 bg-gradient-to-r from-slate-900/60 via-amber-950/30 to-slate-900/60">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.15),transparent_70%)]" />
        <div className="relative py-3 px-4 md:px-8 text-center">
          <p className="text-lg md:text-xl font-serif text-amber-200 tracking-wide drop-shadow-sm" dir="rtl">
            לעילוי נשמת מרת רבקה בת ר׳ מרדכי דוד ע"ה
          </p>
          <p className="text-xs text-amber-400/50 mt-0.5 tracking-widest uppercase" style={{ letterSpacing: '0.15em' }}>
            Tap to read her story
          </p>
        </div>
      </div>

      {/* Hero Section — drop-in photo swap, same square frame as today */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-10 md:py-20">
          <div className="text-center max-w-4xl mx-auto mb-10 md:mb-14">
            <div className="mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-slate-800 blur-2xl rounded-full scale-150" />
                <div
                  className="relative w-36 h-36 md:w-48 md:h-48 mx-auto rounded-2xl overflow-hidden ring-1 ring-white/10"
                  style={{ backgroundColor: '#1e293b' }}
                >
                  <picture>
                    <source
                      type="image/webp"
                      srcSet="/__mockup/images/heroA-384.webp 384w, /__mockup/images/heroA-640.webp 640w, /__mockup/images/heroA-1024.webp 1024w"
                      sizes="(max-width: 768px) 144px, 192px"
                    />
                    <img
                      src="/__mockup/images/heroA-640.jpg"
                      srcSet="/__mockup/images/heroA-384.jpg 384w, /__mockup/images/heroA-640.jpg 640w, /__mockup/images/heroA-1024.jpg 1024w"
                      sizes="(max-width: 768px) 144px, 192px"
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

          {/* Search card placeholder */}
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
