import LegalPageEditor from "@/modules/admin/components/LegalPageEditor"

export default function PrivacyPolicy() {
  return (
    <LegalPageEditor
      pageKey="privacy"
      title="Privacy Policy"
      description="Manage the Privacy Policy content shown across the platform."
      defaultTitle="Privacy Policy"
    />
  )
}
