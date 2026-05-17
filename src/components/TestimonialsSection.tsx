"use client";

import { useState } from "react";

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    location: "New York, USA",
    rating: 5,
    text: "RaoFinds helped me find the perfect laptop at an amazing price. The reviews were spot-on and saved me hours of research!",
    avatar: "SJ",
  },
  {
    id: 2,
    name: "Michael Chen",
    location: "San Francisco, USA",
    rating: 5,
    text: "Best product comparison site I've used. The detailed comparisons helped me choose between similar products with confidence.",
    avatar: "MC",
  },
  {
    id: 3,
    name: "Emma Wilson",
    location: "London, UK",
    rating: 5,
    text: "I love how easy it is to find quality products here. The curated selections save me so much time shopping on Amazon.",
    avatar: "EW",
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const testimonial = testimonials[currentIndex];

  return (
    <section className="bg-surface py-16" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 id="testimonials-heading" className="text-2xl font-bold text-foreground sm:text-3xl">
            What Our Customers Say
          </h2>
          <p className="mt-2 text-sm text-muted">
            Trusted by thousands of shoppers worldwide
          </p>
        </div>

        <div className="mt-10 relative">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-8 shadow-lg sm:p-12">
            <div className="flex items-center gap-1 mb-4" aria-label={`${testimonial.rating} out of 5 stars`}>
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-5 w-5 ${i < testimonial.rating ? "text-brand" : "text-gray-200"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            <blockquote className="text-lg text-foreground sm:text-xl">
              &ldquo;{testimonial.text}&rdquo;
            </blockquote>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white font-semibold">
                {testimonial.avatar}
              </div>
              <div>
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted">{testimonial.location}</p>
              </div>
            </div>
          </div>

          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-brand hover:text-white focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            aria-label="Previous testimonial"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-brand hover:text-white focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            aria-label="Next testimonial"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="mt-6 flex justify-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
                  index === currentIndex ? "bg-brand" : "bg-gray-300"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
