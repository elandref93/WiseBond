export default function Partners() {
  const banks = [
    { name: "ABSA", logo: "ABSA" },
    { name: "FNB", logo: "FNB" },
    { name: "Nedbank", logo: "Nedbank" },
    { name: "Standard Bank", logo: "Standard Bank" },
    { name: "Investec", logo: "Investec" },
  ];

  return (
    <div className="bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
            Our Partners
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Major banks we work with
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {banks.map((bank) => (
            <div 
              key={bank.name}
              className="flex justify-center items-center col-span-1 filter grayscale hover:grayscale-0 transition duration-300"
            >
              <span className="text-gray-400 font-bold text-xl">{bank.logo}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
