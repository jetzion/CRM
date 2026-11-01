import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { fullName, type Contact } from "@/lib/contacts";
import { requireUser } from "@/lib/supabase/server";
import { ContactForm } from "../../contact-form";

export default async function EditContactPage({ params }: PageProps<"/contacts/[id]/edit">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data: contact } = await supabase.from("contacts").select("*").eq("id", id).maybeSingle<Contact>();
  if (!contact) notFound();

  return (
    <>
      <PageHeader title={`Edit ${fullName(contact)}`} />
      <Card>
        <ContactForm contact={contact} />
      </Card>
    </>
  );
}
