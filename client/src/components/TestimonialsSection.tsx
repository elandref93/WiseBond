import { Card, CardContent } from "@/components/ui/card";
import { Star, StarHalf } from "lucide-react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      id: 1,
      content:
        "WiseBond saved us thousands on our home loan! They secured an interest rate nearly 1% below what our bank initially offered. The process was smooth and their consultant was incredibly helpful.",
      author: {
        name: "Sarah Nkosi",
        location: "Cape Town",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=256&q=80",
      },
      rating: 5,
    },
    {
      id: 2,
      content:
        "As first-time home buyers, we had no idea where to start. The team at WiseBond guided us through every step and found us a loan when our bank had rejected our application. Their service is worth every penny!",
      author: {
        name: "Thabo Molefe",
        location: "Johannesburg",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=256&q=80",
      },
      rating: 5,
    },
    {
      id: 3,
      content:
        "I was skeptical at first about using a bond originator, but I'm so glad I did! WiseBond made the entire process stress-free and managed to get me approved for a larger loan amount than I expected.",
      author: {
        name: "Lerato Khumalo",
        location: "Pretoria",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=256&q=80",
      },
      rating: 4.5,
    },
  ];

  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
            Testimonials
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            What our clients say
          </p>
        </div>
        <div className="mt-10">
          <div className="grid gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-primary flex">
                      {Array(Math.floor(testimonial.rating))
                        .fill(0)
                        .map((_, i) => (
                          <Star key={i} className="fill-current" />
                        ))}
                      {testimonial.rating % 1 > 0 && (
                        <StarHalf className="fill-current" />
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{testimonial.content}</p>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden">
                      <img
                        src={testimonial.author.image}
                        alt={`Photo of ${testimonial.author.name}`}
                      />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {testimonial.author.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {testimonial.author.location}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
