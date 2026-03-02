
ALTER TABLE public.pet_reports ADD COLUMN IF NOT EXISTS includes_portrait BOOLEAN DEFAULT false;
ALTER TABLE public.pet_reports ADD COLUMN IF NOT EXISTS redeem_code TEXT;

ALTER TABLE public.chat_credits ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES public.pet_reports(id);
ALTER TABLE public.chat_credits ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.chat_credits ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

CREATE UNIQUE INDEX IF NOT EXISTS chat_credits_report_id_unique ON public.chat_credits(report_id) WHERE report_id IS NOT NULL;
