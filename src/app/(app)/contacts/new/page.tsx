import { Card, PageHeader } from "@/components/ui";
import { ContactForm } from "../contact-form";

export default function NewContactPage() {
  return (
    <>
      <PageHeader title="Add contact" />
      <Card>
        <ContactForm />
      </Card>
    </>
  );
}
