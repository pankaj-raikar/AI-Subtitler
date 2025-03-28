
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How accurate is it?",
    answer: "Our AI achieves 99% accuracy for clear audio. For videos with background noise or heavy accents, accuracy typically remains above 95%. Our system continuously learns and improves with each transcription."
  },
  {
    question: "What languages do you support?",
    answer: "We support 100+ languages and dialects, including English, Spanish, Mandarin, Hindi, Arabic, French, German, Japanese, Portuguese, Russian, and many more. Our system can even detect and transcribe multiple languages within the same video."
  },
  {
    question: "How fast is the subtitle generation?",
    answer: "Our AI typically processes a 5-minute video in just 1 minute. Processing time may vary slightly based on video quality, audio clarity, and current system load."
  },
  {
    question: "What file formats can I export?",
    answer: "You can export your subtitles in all industry-standard formats including SRT, VTT, TXT, SSA, and more. You can also burn subtitles directly into your video or download a transcript."
  },
  {
    question: "Can I edit the subtitles after they're generated?",
    answer: "Absolutely! Our editor allows you to adjust timing, correct text, change fonts, colors, positions, and more. You have complete control over how your subtitles appear."
  },
  {
    question: "Is there a limit to video length or file size?",
    answer: "Free accounts can process videos up to 10 minutes long and 500MB in size. Premium accounts can handle videos up to 4 hours and 2GB. For enterprise needs with longer videos, please contact us."
  }
];

const FaqSection = () => {
  return (
    <section id="faq" className="py-24 bg-secondary/30">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-secondary text-sm font-medium">
            🔍 FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about AI-Subtitler.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg font-medium py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Still have questions?
          </p>
          <a href="#" className="text-primary hover:underline font-medium">
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
