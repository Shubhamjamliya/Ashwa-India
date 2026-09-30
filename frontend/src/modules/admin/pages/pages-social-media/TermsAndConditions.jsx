import LegalPageEditor from "@/modules/admin/components/LegalPageEditor"

export default function TermsAndConditions() {
  return (
    <LegalPageEditor
      pageKey="terms"
      title="Terms & Conditions"
      description="Manage the Terms & Conditions shown across the platform."
      defaultTitle="Terms & Conditions"
    />
  )
}
