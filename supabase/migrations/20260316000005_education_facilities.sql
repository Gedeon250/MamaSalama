-- ============================================================
-- Education Articles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.education_articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  summary         TEXT NOT NULL,
  content         TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('prenatal','postnatal','nutrition','child-development','mental-health','breastfeeding')),
  content_type    TEXT NOT NULL CHECK (content_type IN ('article','video','course','lesson')),
  image_url       TEXT,
  video_url       TEXT,
  external_url    TEXT,
  source          TEXT,
  read_time       INTEGER NOT NULL DEFAULT 5,
  duration        INTEGER,
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.education_articles ENABLE ROW LEVEL SECURITY;

-- Everyone (including anon) can read articles
CREATE POLICY "articles_public_read" ON public.education_articles
  FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "articles_admin_write" ON public.education_articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Health Facilities
-- ============================================================
CREATE TABLE IF NOT EXISTS public.health_facilities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('hospital','clinic','pharmacy')),
  address     TEXT NOT NULL,
  district    TEXT,
  province    TEXT DEFAULT 'Kigali',
  phone       TEXT,
  rating      NUMERIC(2,1),
  is_open     BOOLEAN DEFAULT true,
  services    TEXT[],
  latitude    NUMERIC(10,7),
  longitude   NUMERIC(10,7),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.health_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facilities_public_read" ON public.health_facilities
  FOR SELECT USING (true);

CREATE POLICY "facilities_admin_write" ON public.health_facilities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Seed: Education Articles (Rwanda-specific maternal health)
-- ============================================================
INSERT INTO public.education_articles
  (title, summary, content, category, content_type, image_url, source, read_time, is_featured)
VALUES

-- PRENATAL
(
  'Your First Antenatal Visit: What to Expect in Rwanda',
  'A guide to your first ANC visit at a Rwandan health facility — what tests are done, what to bring, and questions to ask.',
  'In Rwanda, the Ministry of Health recommends at least eight antenatal care (ANC) visits during pregnancy. Your first visit should happen before 12 weeks of pregnancy.

What happens at your first ANC visit?

Your health worker will measure your height and weight to calculate your Body Mass Index (BMI). They will take your blood pressure and check your urine for protein and glucose. Blood tests will screen for anaemia (low haemoglobin), HIV, syphilis, blood group, and rhesus factor.

An ultrasound scan may be offered if available at your facility to confirm the pregnancy, estimate your due date, and check for twins.

You will receive your Mother and Child Health (MCH) booklet — keep it safe and bring it to every visit.

What to bring:
- Your national ID (Indangamuntu)
- Your Mutuelle de Santé card or health insurance details
- Any previous medical records

Iron and folic acid supplements will be prescribed to prevent anaemia and neural tube defects. Intermittent preventive treatment for malaria (IPTp) with sulfadoxine-pyrimethamine (SP) will begin from 16 weeks.

Questions to ask:
- When is my expected due date?
- Are my blood pressure and weight normal?
- Which danger signs should bring me back immediately?

Remember: ANC visits are free of charge under Rwanda''s Mutuelle de Santé community health insurance. Do not miss any scheduled visit — each one protects both you and your baby.',
  'prenatal', 'article',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
  'Rwanda Ministry of Health', 7, true
),

(
  'Danger Signs in Pregnancy: When to Seek Help Immediately',
  'Recognise the warning signs that require emergency care during pregnancy. Every mother in Rwanda should know these signs.',
  'Knowing the danger signs of pregnancy can save your life and your baby''s life. If you experience any of the following signs, go immediately to the nearest health facility — do not wait until your next ANC visit.

Danger Signs During Pregnancy:

1. Severe headache that does not go away
This may be a sign of pre-eclampsia, a serious condition causing high blood pressure. If accompanied by blurred vision, swelling of the face or hands, or pain under the ribs — this is an emergency.

2. Vaginal bleeding
Any bleeding during pregnancy needs immediate evaluation. Light spotting in early pregnancy can be normal, but heavy bleeding at any stage is always an emergency.

3. Severe abdominal pain
Constant, severe pain in the abdomen — especially if you feel faint — can indicate placental abruption or ectopic pregnancy.

4. Fever over 38°C
Fever during pregnancy increases the risk of miscarriage and preterm birth. Malaria is a common cause in Rwanda — seek care immediately for any fever.

5. Reduced or no fetal movement
After 28 weeks you should feel your baby move at least 10 times in two hours. If movement reduces significantly, go to the health facility.

6. Difficulty breathing or chest pain
This can indicate severe anaemia or a heart problem.

7. Convulsions (fits)
Seizures during pregnancy are a life-threatening emergency — call 912 immediately.

8. Leaking fluid from the vagina before labour
This may mean your waters have broken early (PROM) — infection can develop within hours.

In Rwanda you can call 912 for emergency services, or ask your Community Health Worker (CHW) for help transporting you to a health facility.',
  'prenatal', 'article',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
  'Rwanda Biomedical Centre', 6, false
),

(
  'Malaria Prevention During Pregnancy in Rwanda',
  'Malaria is dangerous for both mother and baby. Learn how Rwanda''s free prevention program protects you.',
  'Malaria during pregnancy is a major cause of maternal anaemia, low birth weight babies, and maternal death in Rwanda. The good news: prevention is free and effective.

Intermittent Preventive Treatment in Pregnancy (IPTp)

Starting from your second ANC visit (at 16 weeks), you will be given sulfadoxine-pyrimethamine (SP or Fansidar) tablets to swallow at the clinic. This medicine kills any malaria parasites in the blood before they cause illness, even if you have no symptoms.

You should receive SP at each ANC visit from 16 weeks until delivery — at least three doses are recommended. This is provided free of charge at all Rwanda public health facilities.

Insecticide-Treated Bed Nets (ITNs)

Every pregnant woman in Rwanda is entitled to a free long-lasting insecticide-treated net (LLIN) at her first ANC visit. Sleeping under this net every night reduces your risk of malaria by up to 50%.

Tips for maximum protection:
- Use your net every night, even in dry season
- Tuck the net under the mattress before sleeping
- Check for holes and repair them immediately
- Do not wash the net with soap — it removes the insecticide

If you develop a fever

Malaria can progress quickly in pregnancy. If you have a fever over 37.5°C, go to the health facility the same day for a rapid malaria test (RDT). Treatment with artemether-lumefantrine (Coartem) is safe in the second and third trimester.

Do not use herbal remedies as a substitute for malaria treatment during pregnancy.',
  'prenatal', 'article',
  'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=800',
  'Rwanda Biomedical Centre', 5, false
),

-- POSTNATAL
(
  'The First 48 Hours After Birth: Postnatal Care in Rwanda',
  'What happens immediately after delivery at a Rwandan health facility and what to watch for at home.',
  'In Rwanda, mothers and newborns are required to stay at the health facility for at least 24 hours after a normal vaginal birth, and at least 48 hours after a caesarean section. This period is critical for both of you.

Immediate care for your newborn:

Within the first minute of birth, your baby will be dried and placed on your chest for skin-to-skin contact. This keeps the baby warm, reduces stress, and starts breastfeeding. Cord clamping is delayed for 1–3 minutes to allow extra blood to transfer from the placenta.

Your baby will receive:
- Vitamin K injection (prevents bleeding)
- Chlorhexidine gel on the umbilical cord stump
- Eye drops or ointment (prevents infection)
- BCG vaccine and oral polio vaccine (OPV) before discharge

First breastfeed:

Try to breastfeed within the first hour of birth. This first milk, called colostrum, is golden-yellow and thick — it is packed with antibodies and is the best protection you can give your newborn. Do not discard it.

Your postnatal checks:

Over the 24–48 hours, health workers will check:
- Your blood pressure and temperature
- Bleeding from the uterus (lochia)
- Your ability to pass urine
- The healing of any stitches

Warning signs after you go home:

Go back to the health facility immediately if you have:
- Heavy vaginal bleeding (soaking more than one pad per hour)
- Fever above 38°C
- Severe headache or vision changes
- Pain, redness or discharge from a wound or episiotomy
- Difficulty or inability to breastfeed
- Signs of depression (feeling hopeless, unable to care for baby)

Your first postnatal follow-up visit should be at 3 days, then 7 days, then 6 weeks.',
  'postnatal', 'article',
  'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800',
  'Rwanda Ministry of Health', 7, false
),

(
  'Postpartum Depression: It''s Real and Help Is Available',
  'Up to 1 in 5 mothers experiences postpartum depression. Recognise the signs and know where to get support in Rwanda.',
  'Having a baby is one of the biggest life changes a woman can experience. It is normal to feel a mix of emotions — joy, exhaustion, worry. But when sadness, anxiety, or emptiness persist for more than two weeks and interfere with your ability to care for yourself or your baby, you may have postpartum depression (PPD).

How common is it?

In Rwanda, studies show that 10–25% of new mothers experience postpartum depression. It is NOT a sign of weakness. It is a medical condition caused by the dramatic hormonal changes after birth, combined with sleep deprivation and the pressures of caring for a newborn.

Signs of postpartum depression:
- Persistent sadness, emptiness, or hopelessness
- Crying for no clear reason
- Feeling irritable or angry more than usual
- Loss of interest in activities you used to enjoy
- Difficulty bonding with your baby
- Feeling like a bad mother
- Trouble sleeping even when the baby sleeps
- Changes in appetite
- Difficulty concentrating
- Thoughts of harming yourself or your baby (seek help immediately)

Baby blues vs. PPD

The "baby blues" — feeling tearful, anxious, or irritable in the first 1–2 weeks after birth — are very common and usually pass on their own. Postpartum depression is different: it is more severe, lasts longer, and requires treatment.

Where to get help in Rwanda:

Tell your CHW or the health worker at your postnatal visit how you are feeling. Your health centre can refer you to a mental health counsellor. Butaro Cancer and Mental Health Hospital and Rwanda Mental Health Hospital in Ndera offer specialised care.

You can also call Rwanda''s mental health helpline: 114

Treatment — including counselling and medication when needed — is effective and covered under Mutuelle de Santé.',
  'mental-health', 'article',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'Rwanda Biomedical Centre', 6, false
),

-- NUTRITION
(
  'Nutrition During Pregnancy: Eating Well in Rwanda',
  'A practical guide to eating for two using local Rwandan foods — what to eat more of, what to avoid, and daily portion sizes.',
  'Good nutrition during pregnancy supports your baby''s brain development, builds strong bones, and reduces the risk of complications. You do not need to eat expensive imported foods — Rwanda''s local foods provide excellent nutrition.

Key nutrients and local sources:

Iron (prevents anaemia):
- Beans, lentils, soya, groundnuts
- Dark leafy vegetables: spinach, amaranth, sweet potato leaves
- Offal (liver, kidney) — eat once a week
- Pair with Vitamin C foods (tomatoes, oranges) to boost absorption
- Avoid drinking tea with meals as it reduces iron absorption

Folic acid (prevents neural tube defects):
- Beans, lentils, groundnuts
- Dark leafy vegetables
- Fortified flour products
- Your health worker will also prescribe folic acid tablets

Calcium (builds baby''s bones and teeth):
- Milk, yoghurt (ikivuguto)
- Dried small fish (sambaza)
- Soya, beans, sesame seeds

Protein (builds baby''s tissues):
- Beans, lentils, eggs, fish, meat
- Aim for a portion of protein at each meal

Carbohydrates (energy):
- Cassava, sweet potato, Irish potato, rice, maize, sorghum
- Choose a variety to get different nutrients

A balanced plate at each meal:
- ½ plate: vegetables and fruits
- ¼ plate: starchy foods (cassava, potato, rice)
- ¼ plate: protein (beans, eggs, fish, meat)

Foods to avoid or limit:
- Raw or undercooked meat and fish (risk of toxoplasmosis and listeria)
- Unpasteurised milk (risk of listeria)
- Excessive tea and coffee (more than 2 cups per day reduces iron absorption)
- Alcohol — there is no safe amount during pregnancy

Drink at least 8 glasses of clean water daily. If your urine is dark yellow, you are not drinking enough.

Weight gain:
- Normal weight before pregnancy: aim for 11–16 kg total gain
- Underweight: 13–18 kg
- Overweight: 7–11 kg

Your health worker will monitor your weight at every ANC visit.',
  'nutrition', 'article',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
  'Rwanda Ministry of Health', 8, false
),

(
  'Exclusive Breastfeeding: Rwanda''s Guidelines for the First 6 Months',
  'Rwanda has one of Africa''s highest exclusive breastfeeding rates. Here''s everything you need to know about breastfeeding your newborn.',
  'Rwanda''s Ministry of Health recommends exclusive breastfeeding for the first six months of life. This means giving your baby only breast milk — no water, no formula, no other liquids or foods — for 180 days. Rwanda has achieved over 85% exclusive breastfeeding rates, among the highest in Africa.

Why exclusive breastfeeding?

Breast milk is the perfect food for your baby. It contains:
- All the nutrients your baby needs in the right proportions
- Antibodies that protect against diarrhoea, pneumonia, and other infections
- Hormones that support healthy gut development
- Factors that promote brain development

Breastfed babies in Rwanda are less likely to be hospitalised in the first year of life.

Positioning and attachment:

Getting the latch right prevents sore nipples and ensures your baby gets enough milk.

Signs of a good latch:
- Baby''s mouth is wide open
- More areola (dark skin) visible above the baby''s lip than below
- Baby''s chin touches the breast
- You feel a drawing/tugging sensation, not pain
- You can hear your baby swallowing

How often to feed:

Newborns feed 8–12 times in 24 hours. Feed on demand — whenever your baby shows hunger cues (rooting, bringing hands to mouth, turning head). Do not wait until the baby cries.

Common challenges:

Sore nipples: Check the latch first — poor attachment is the most common cause. Apply a few drops of expressed breast milk to the nipple after feeding and allow to air-dry.

Not enough milk: The more you feed, the more milk you produce. Supplement feeding with formula or water will reduce your milk supply. Drink plenty of fluids and eat well.

Engorgement: Feed frequently, apply warm compresses before feeding, and cold compresses afterwards.

After 6 months:

Introduce complementary foods while continuing to breastfeed up to 2 years and beyond.',
  'breastfeeding', 'article',
  'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800',
  'Rwanda Ministry of Health', 7, true
),

-- CHILD DEVELOPMENT
(
  'Baby Milestones 0–12 Months: What to Expect and When',
  'A month-by-month guide to your baby''s development in the first year, with signs that may need a health worker''s attention.',
  'Every baby develops at their own pace, but tracking developmental milestones helps identify any delays early so your baby can get support.

0–3 Months:
Motor: Lifts head briefly when on tummy; makes fist with hands
Social: Smiles in response to your face; makes eye contact
Communication: Cries to signal needs; coos and gurgles

3–6 Months:
Motor: Rolls from tummy to back; holds head steady; reaches for objects
Social: Laughs out loud; recognises familiar faces
Communication: Babbles; turns towards sounds

6–9 Months:
Motor: Sits with support, then without support; passes object between hands
Social: Shows anxiety around strangers
Communication: Babbles strings of sounds ("bababa", "mamama")

9–12 Months:
Motor: Pulls to stand; cruises along furniture; may take first steps
Social: Waves bye-bye; plays peek-a-boo; points at objects of interest
Communication: Says 1–2 words with meaning (e.g. "mama", "dada")

Red flags — see a health worker if your baby:
- Does not smile by 3 months
- Cannot hold head up by 4 months
- Does not reach for objects by 6 months
- Does not sit without support by 9 months
- Does not babble by 9 months
- Does not pull to stand by 12 months
- Has lost skills they previously had at any age

Growth monitoring:

Your baby''s weight, height, and head circumference should be measured at every visit to the health centre. These measurements are plotted on a growth chart in your MCH booklet. Ask your health worker to explain the chart at each visit.',
  'child-development', 'article',
  'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800',
  'Rwanda Ministry of Health', 7, false
),

(
  'Rwanda''s Child Vaccination Schedule: Protect Your Baby',
  'A complete guide to Rwanda''s Expanded Programme on Immunisation (EPI) schedule — every vaccine your child needs and when.',
  'Rwanda''s Expanded Programme on Immunisation (EPI) provides free vaccines to all children under five. Rwanda has consistently achieved over 95% vaccination coverage, one of the highest in Africa.

At Birth (at the health facility):
- BCG: Protects against tuberculosis (TB), especially severe forms in infants
- OPV 0 (Oral Polio Vaccine): First dose of polio protection

At 6 Weeks:
- OPV 1
- Pentavalent 1 (DTP-HepB-Hib): Protects against diphtheria, tetanus, whooping cough, hepatitis B, and Hib meningitis
- PCV 1 (Pneumococcal): Protects against pneumonia and meningitis caused by Streptococcus pneumoniae
- Rotavirus 1: Protects against rotavirus diarrhoea, the leading cause of severe diarrhoea in infants

At 10 Weeks:
- OPV 2
- Pentavalent 2
- PCV 2
- Rotavirus 2

At 14 Weeks:
- OPV 3
- Pentavalent 3
- PCV 3
- IPV (Inactivated Polio Vaccine)

At 9 Months:
- Measles-Rubella (MR) 1: Protects against measles and rubella
- Yellow Fever: One dose provides lifelong protection

At 15 Months:
- Measles-Rubella (MR) 2: Second dose for full protection

Keep your MCH booklet safe — it is your child''s vaccination record. Carry it to every health facility visit.

Are vaccines safe?

Yes. Rwanda''s vaccines are approved by the World Health Organization and supplied through UNICEF. Minor side effects (slight fever, soreness at injection site) are normal and last 1–2 days. Serious side effects are extremely rare.

Missing a dose?

If your child misses a vaccine, bring them to the health centre as soon as possible. The vaccination schedule can be restarted or caught up — it is never too late.',
  'child-development', 'lesson',
  'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800',
  'Rwanda Biomedical Centre (RBC)', 8, false
),

-- MENTAL HEALTH
(
  'Managing Stress and Anxiety During Pregnancy',
  'Practical strategies for managing the emotional challenges of pregnancy, rooted in Rwanda''s community support systems.',
  'Stress and anxiety are common during pregnancy. Financial pressures, relationship changes, fear of childbirth, and physical discomforts all contribute. Mild stress is normal — but chronic severe stress can affect your baby''s development and your own health.

How stress affects pregnancy:
- Raises blood pressure, increasing risk of pre-eclampsia
- Can trigger preterm labour
- Affects the baby''s stress response system
- Increases risk of postpartum depression

Strategies that work:

1. Talk to someone you trust
In Rwanda, the umugoroba w''ababyeyi (parents'' evening meeting) and women''s savings groups (ubudehe) provide built-in community support. Share your worries — you are not alone.

2. Gentle exercise
Walking for 30 minutes most days reduces stress hormones and improves sleep. Swimming is also excellent if available to you.

3. Rest and sleep
Sleep on your left side after 20 weeks (improves blood flow to the baby). Use pillows to support your bump and between your knees. Aim for 8 hours at night plus a rest in the afternoon if possible.

4. Breathing exercises
Slow, deep breathing activates the parasympathetic nervous system and reduces anxiety quickly. Try: breathe in for 4 counts, hold for 4, breathe out for 6. Repeat 5 times.

5. Limit news and social media
Constant bad news increases anxiety. Set limits on how much you read or watch each day.

6. Practical problem-solving
If financial stress is the main worry, speak to your CHW about social protection programs available in Rwanda — VUP (Vision Umurenge Programme) provides cash transfers to vulnerable households.

When to seek professional help:
If anxiety or worry is severe, constant, or preventing you from functioning normally, speak to a health worker. Mental health counselling is available at district hospitals and is covered by Mutuelle de Santé.',
  'mental-health', 'article',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
  'Rwanda Mental Health Programme', 6, false
);

-- ============================================================
-- Seed: Health Facilities (Real Kigali facilities)
-- ============================================================
INSERT INTO public.health_facilities
  (name, type, address, district, province, phone, rating, is_open, services, latitude, longitude)
VALUES

-- Hospitals
(
  'King Faisal Hospital Kigali',
  'hospital',
  'KG 544 St, Kacyiru, Gasabo District',
  'Gasabo', 'Kigali',
  '+250788300093',
  4.6, true,
  ARRAY['Maternity & Obstetrics','Antenatal Care','Emergency','ICU','Surgery','Paediatrics','Laboratory'],
  -1.9441, 30.0619
),
(
  'CHUK – University Teaching Hospital of Kigali',
  'hospital',
  'KN 4 Ave, Nyarugenge District',
  'Nyarugenge', 'Kigali',
  '+250788301700',
  4.4, true,
  ARRAY['Maternity','Antenatal Care','Emergency','Neonatology','Surgery','Radiology'],
  -1.9519, 30.0576
),
(
  'Rwanda Military Hospital',
  'hospital',
  'KG 626 St, Kanombe, Kicukiro District',
  'Kicukiro', 'Kigali',
  '+250788302900',
  4.3, true,
  ARRAY['Maternity','Emergency','Surgery','Paediatrics','Laboratory','Pharmacy'],
  -1.9731, 30.1365
),
(
  'Kibagabaga District Hospital',
  'hospital',
  'KG 7 Ave, Kimironko, Gasabo District',
  'Gasabo', 'Kigali',
  '+250788302520',
  4.1, true,
  ARRAY['Maternity','ANC','Vaccination','Emergency','Surgery','Laboratory'],
  -1.9315, 30.1126
),
(
  'Masaka District Hospital',
  'hospital',
  'Masaka, Kicukiro District',
  'Kicukiro', 'Kigali',
  '+250788200110',
  4.0, true,
  ARRAY['Maternity','ANC','Emergency','Vaccination','Pharmacy'],
  -2.0040, 30.0943
),

-- Clinics / Health Centres
(
  'Remera Health Centre',
  'clinic',
  'KG 11 Ave, Remera, Gasabo District',
  'Gasabo', 'Kigali',
  '+250788301440',
  4.2, true,
  ARRAY['ANC','Postnatal Care','Family Planning','Vaccination','HIV/ART','Nutrition'],
  -1.9573, 30.1056
),
(
  'Kimironko Health Centre',
  'clinic',
  'KG 14 Ave, Kimironko, Gasabo District',
  'Gasabo', 'Kigali',
  '+250788301520',
  4.1, true,
  ARRAY['ANC','Vaccination','Family Planning','HIV/ART','Nutrition','Mental Health'],
  -1.9375, 30.1127
),
(
  'Gikondo Health Centre',
  'clinic',
  'KK 15 Ave, Gikondo, Kicukiro District',
  'Kicukiro', 'Kigali',
  '+250788303140',
  3.9, true,
  ARRAY['ANC','Postnatal Care','Vaccination','Family Planning','HIV/ART'],
  -1.9819, 30.0778
),
(
  'Nyamirambo Health Centre',
  'clinic',
  'KN 22 Ave, Nyamirambo, Nyarugenge District',
  'Nyarugenge', 'Kigali',
  '+250788303600',
  4.0, true,
  ARRAY['ANC','Vaccination','Family Planning','HIV/ART','Nutrition'],
  -1.9793, 30.0446
),
(
  'Muhima Health Centre',
  'clinic',
  'KN 3 Ave, Muhima, Nyarugenge District',
  'Nyarugenge', 'Kigali',
  '+250788303590',
  3.8, true,
  ARRAY['ANC','Postnatal Care','Vaccination','Family Planning'],
  -1.9583, 30.0510
),

-- Pharmacies
(
  'Pharmacie Centrale de Kigali',
  'pharmacy',
  'KN 3 Ave, Downtown Kigali, Nyarugenge',
  'Nyarugenge', 'Kigali',
  '+250788501100',
  4.4, true,
  ARRAY['Prescription Medicines','OTC Medicines','Maternal Supplements','Baby Products'],
  -1.9497, 30.0591
),
(
  'Pharmacie Médicale de Kigali',
  'pharmacy',
  'KG 7 Ave, Kacyiru, Gasabo District',
  'Gasabo', 'Kigali',
  '+250788501200',
  4.3, true,
  ARRAY['Prescription Medicines','Maternal Supplements','Baby Products','Medical Devices'],
  -1.9439, 30.0765
),
(
  'TopPharm Kimironko',
  'pharmacy',
  'KG 15 Ave, Kimironko, Gasabo District',
  'Gasabo', 'Kigali',
  '+250788502100',
  4.1, true,
  ARRAY['Prescription Medicines','OTC Medicines','Maternal Supplements','Baby Products'],
  -1.9356, 30.1098
);
