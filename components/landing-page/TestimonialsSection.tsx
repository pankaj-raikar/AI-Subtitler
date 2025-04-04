
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    avatar: "ML",
    name: "Maria L.",
    role: "Content Creator",
    content: "AI-Subtitler saved me 10 hours a week! My audience engagement doubled thanks to multilingual subs.",
    stars: 5
  },
  {
    avatar: "TL",
    name: "TechLearn Inc.",
    role: "Corporate Training",
    content: "Finally, a tool that nails technical jargon. Perfect for our corporate training videos!",
    stars: 5
  },
  {
    avatar: "JP",
    name: "James P.",
    role: "YouTuber",
    content: "I've tried many subtitle tools before, but nothing comes close to the accuracy and ease of AI-Subtitler.",
    stars: 5
  }
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 bg-secondary/30">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary text-sm font-medium">
            💬 Testimonials
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Loved by Video Creators
          </h2>
          <p className="text-xl text-muted-foreground">
            See what our users are saying about AI-Subtitler.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="feature-card">
              <div className="flex items-center gap-2 mb-4">
                {Array.from({ length: testimonial.stars }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-lg mb-6">"{testimonial.content}"</p>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">{testimonial.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm">
            <span className="flex gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <Star className="h-4 w-4 fill-primary text-primary" />
              <Star className="h-4 w-4 fill-primary text-primary" />
              <Star className="h-4 w-4 fill-primary text-primary" />
              <Star className="h-4 w-4 fill-primary text-primary" />
            </span>
            <span className="font-medium">4.9/5 from 500+ reviews</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
