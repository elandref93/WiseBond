export default function Partners() {
  // Bank logos with image paths
  const bankLogos = [
    { name: "Standard Bank", src: "/src/assets/images/banks/bank-logo-1.png" },
    { name: "ABSA", src: "/src/assets/images/banks/bank-logo-2.png" },
    { name: "FNB", src: "/src/assets/images/banks/bank-logo-3.png" },
    { name: "Nedbank", src: "/src/assets/images/banks/bank-logo-4.png" },
    { name: "Investec", src: "/src/assets/images/banks/bank-logo-5.png" },
    { name: "SA Home Loans", src: "/src/assets/images/banks/bank-logo-6.png" },
    { name: "RMB", src: "/src/assets/images/banks/bank-logo-7.png" },
    { name: "Sentinel Home Loans", src: "/src/assets/images/banks/bank-logo-8.png" }
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
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            We work with South Africa's leading financial institutions to find you the best possible home loan at the most competitive rate.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-4">
          {bankLogos.map((bank, index) => (
            <div 
              key={bank.name}
              className="flex justify-center items-center col-span-1 bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-300 h-28"
            >
              <img 
                src={bank.src} 
                alt={bank.name} 
                className="h-20 object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
