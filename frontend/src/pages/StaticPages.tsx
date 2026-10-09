import { usePageTitle } from '@/components/PageHeader';
import { PageHeader } from '@/components/PageHeader';

export function PrivacyPage() {
  usePageTitle('গোপনীয়তা নীতি | Privacy Policy');
  return (
    <>
      <PageHeader title="গোপনীয়তা নীতি / Privacy Policy" />
      <section className="section">
        <div className="shell max-w-3xl prose-bn space-y-4 text-farm-700">
          <p>
            শাহ কৃষি তথ্য পাঠাগার ও জাদুঘর (SAIL) ভিজিটরদের গোপনীয়তাকে গুরুত্ব দেয়। যোগাযোগ ফর্মে দেওয়া
            তথ্য শুধুমাত্র আপনার বার্তার উত্তর দিতে ও সেবার উন্নয়নে ব্যবহৃত হয়। আমরা আপনার অনুমতি ছাড়া
            तথ্য তৃতীয় পক্ষের কাছে বিক্রি বা হস্তান্তর করি না।
          </p>
          <p>
            We collect only the information you voluntarily submit through the contact form (name, email,
            subject and message). This data is stored securely and used solely to respond to your enquiry.
            We do not sell or share your data with third parties without your consent.
          </p>
          <p>
            এই ওয়েবসাইটে কুকি ও স্থানীয় স্টোরেজ শুধুমাত্র আপনার ভাষা নির্বাচনের মতো পছন্দ সংরক্ষণে ব্যবহৃত
            হতে পারে। কোনো ব্রাউজার নিজস্ব অনুবাদ এই সাইটের অফিসিয়াল ভাষা ব্যবস্থা নয়।
          </p>
        </div>
      </section>
    </>
  );
}

export function TermsPage() {
  usePageTitle('ব্যবহারের শর্তাবলি | Terms of Use');
  return (
    <>
      <PageHeader title="ব্যবহারের শর্তাবলি / Terms of Use" />
      <section className="section">
        <div className="shell max-w-3xl prose-bn space-y-4 text-farm-700">
          <p>
            এই ওয়েবসাইটের সকল কনটেন্ট শাহ কৃষি তথ্য পাঠাগার ও জাদুঘরের সম্পত্তি। কনটেন্ট শুধুমাত্র
            শিক্ষা ও তথ্যের উদ্দেশ্যে ব্যবহার করা যাবে। অননুমোদিত বাণিজ্যিক ব্যবহার নিষিদ্ধ।
          </p>
          <p>
            All content on this website is provided for educational and informational purposes. Please
            credit SAIL when reusing material. Automated scraping and commercial redistribution without
            permission are not permitted.
          </p>
        </div>
      </section>
    </>
  );
}
