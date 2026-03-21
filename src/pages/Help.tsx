import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MessageCircle, Mail, Phone, ExternalLink } from 'lucide-react';

const faqs = [
  {
    question: 'How do I set up vaccination reminders?',
    answer: 'Go to the Reminders tab and tap on "Add Reminder". Select "Vaccination" as the type, then choose the vaccine and scheduled date. You\'ll receive push notifications before the due date.',
  },
  {
    question: 'How can I find nearby health facilities?',
    answer: 'Tap on the Facilities icon from the dashboard or navigate to the Facilities page. You can search by name or filter by type (hospital, clinic, pharmacy). Tap on any facility to get directions.',
  },
  {
    question: 'Is my health data secure?',
    answer: 'Yes! All your health information is encrypted and stored securely. We follow strict privacy guidelines and never share your personal data with third parties without your explicit consent.',
  },
  {
    question: 'How do I track my child\'s growth?',
    answer: 'From the dashboard, tap on the growth tracker or go to Profile > Manage Children. You can log weight and height measurements, and we\'ll show you how your child compares to WHO growth standards.',
  },
  {
    question: 'Can I use the app offline?',
    answer: 'Yes! Health articles can be downloaded for offline reading. Your reminders will still work offline, though you\'ll need an internet connection to access community features and find facilities.',
  },
  {
    question: 'How do I contact a health worker?',
    answer: 'In the Community section, tap on "Chat with Health Worker". You can send messages and they\'ll respond within 24 hours. For emergencies, use the Emergency tab instead.',
  },
  {
    question: 'How do I change the app language?',
    answer: 'Go to Profile > Language and select your preferred language. Currently we support English and Swahili, with more languages coming soon.',
  },
];

export default function Help() {
  const navigate = useNavigate();
  return (
    <PageLayout title="Help & Support" showBack>
      <div className="px-4 py-6 space-y-6">
        {/* Contact Options */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/chat')}>
            <MessageCircle className="w-6 h-6 text-primary" />
            <span>Live Chat</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => window.location.href = 'mailto:support@mamacarehub.rw'}>
            <Mail className="w-6 h-6 text-primary" />
            <span>Email Us</span>
          </Button>
        </div>

        {/* FAQs */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Frequently Asked Questions</h3>
          <Accordion type="single" collapsible className="bg-card rounded-xl shadow-soft border border-border">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border-border">
                <AccordionTrigger className="px-4 text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Additional Resources */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Resources</h3>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-between" onClick={() => navigate('/education')}>
              User Guide
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="ghost" className="w-full justify-between" onClick={() => navigate('/education')}>
              Video Tutorials
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="ghost" className="w-full justify-between" onClick={() => window.open('https://mamacarehub.rw/terms', '_blank')}>
              Terms of Service
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="ghost" className="w-full justify-between" onClick={() => navigate('/privacy-settings')}>
              Privacy Policy
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Emergency Note */}
        <div className="bg-destructive/10 rounded-xl p-4">
          <h4 className="font-medium text-destructive mb-2">⚠️ Medical Emergency?</h4>
          <p className="text-sm text-muted-foreground mb-3">
            If you or your child are experiencing a medical emergency, don't use this app. Call emergency services immediately.
          </p>
          <Button variant="destructive" size="sm" className="gap-2" onClick={() => window.location.href = 'tel:112'}>
            <Phone className="w-4 h-4" />
            Call Emergency (112)
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
