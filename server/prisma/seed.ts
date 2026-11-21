import { PrismaClient } from '@prisma/client';
import { format, addDays, subDays } from 'date-fns';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Digital Paper Agenda database...');

  // 0. Single application user
  const defaultEmail = 'eng.amralihassan@gmail.com';
  const existingUser = await prisma.user.findUnique({
    where: { email: defaultEmail },
  });
  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: defaultEmail,
        password: await bcrypt.hash('password123', 10),
        name: 'Amr Al-Hassan',
      },
    });
  }

  // 1. Settings
  await prisma.appSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      language: 'ar',
      firstDayOfWeek: 1,
      startHour: 6,
      endHour: 22,
      paperTone: 'ivory',
    },
  });

  // 2. Categories
  const categories = [
    { id: 'cat-editorial', name: 'Editorial', color: '#8c2d19' },
    { id: 'cat-atelier', name: 'Atelier', color: '#2d5a46' },
    { id: 'cat-personal', name: 'Personal', color: '#675d52' },
    { id: 'cat-archive', name: 'Archive', color: '#1e2229' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: cat,
      create: cat,
    });
  }

  // Helper to seed a day's agenda
  async function seedDay(dateStr: string, isSampleWednesday = false) {
    // Priorities
    await prisma.dailyPriority.upsert({
      where: { date_position: { date: dateStr, position: 1 } },
      update: {},
      create: {
        date: dateStr,
        position: 1,
        title: isSampleWednesday
          ? 'Finalize architectural blueprints for the gallery pavilion'
          : 'Refine editorial manuscript layout & typography proofs',
        isCompleted: true,
        category: null,
      },
    });

    await prisma.dailyPriority.upsert({
      where: { date_position: { date: dateStr, position: 2 } },
      update: {},
      create: {
        date: dateStr,
        position: 2,
        title: isSampleWednesday
          ? 'Curatorial review with Mme. Vivienne (bring raw travertine & brass swatches)'
          : 'Curatorial review & material inspection (unbleached linen & brass)',
        isCompleted: false,
        category: 'Urgent',
      },
    });

    await prisma.dailyPriority.upsert({
      where: { date_position: { date: dateStr, position: 3 } },
      update: {},
      create: {
        date: dateStr,
        position: 3,
        title: isSampleWednesday
          ? 'Dispatch handwritten autumn correspondence & inspect catalog press proofings'
          : 'Dispatch handwritten archival correspondence to library conservator',
        isCompleted: false,
        category: '15:00',
      },
    });

    // Schedule Events
    const eventsData = [
      {
        startTime: '07:00',
        endTime: '08:00',
        title: 'Morning coffee & silent journal reflection',
        description: 'Calligraphy: "Quiet morning mist upon the courtyard"',
        category: 'Reflection',
      },
      {
        startTime: '08:00',
        endTime: '09:00',
        title: 'Studio preparation & incoming parcel sorting',
        description: 'London shipment of 120gsm laid paper',
        category: 'Atelier',
      },
      {
        startTime: '09:00',
        endTime: '10:00',
        title: 'Architectural team synch · Gallery ceiling lighting specifications',
        location: 'Salle I',
        category: 'Salle I',
      },
      {
        startTime: '10:00',
        endTime: '11:00',
        title: 'Material library consultation: vetting unfilled travertine & brushed brass',
        category: 'Archive',
      },
      {
        startTime: '11:00',
        endTime: '12:00',
        title: 'Private collector walk-through · Suite 4B',
        category: 'M. de R.',
      },
      {
        startTime: '12:00',
        endTime: '13:00',
        title: 'Luncheon at Le Petit Comptoir with atelier master',
        category: 'Personal',
      },
      {
        startTime: '14:00',
        endTime: '15:00',
        title: 'Design critique: Typography proofs for seasonal catalog (Baskerville setting)',
        category: 'Editorial',
      },
      {
        startTime: '15:00',
        endTime: '16:00',
        title: 'Engraving workshop inspection · Copperplate seal dies',
        category: 'Atelier',
      },
      {
        startTime: '17:00',
        endTime: '18:00',
        title: "Studio wrap-up, desk clearance & morrow's task migration",
        category: 'Atelier',
      },
    ];

    for (const ev of eventsData) {
      await prisma.scheduleEvent.create({
        data: {
          date: dateStr,
          ...ev,
        },
      });
    }

    // Tasks
    const tasksData = [
      {
        title: 'Review final proofs of hand-bound artist portfolios',
        startTime: '09:15',
        priority: 'normal',
        isCompleted: true,
        order: 1,
      },
      {
        title: 'Confirm courier insurance declaration for Antwerp shipment',
        startTime: '11:40',
        priority: 'urgent',
        isCompleted: true,
        order: 2,
      },
      {
        title: 'Sign provenance certificates for collector archival folio edition (12 copies)',
        priority: 'urgent',
        isCompleted: false,
        order: 3,
      },
      {
        title: 'Replenish sepia liquid ink jars & 120gsm French laid paper stocks',
        priority: 'normal',
        isCompleted: false,
        order: 4,
      },
      {
        title: 'Reschedule frame gilding appointment with M. Laurent (Deferred to Thursday)',
        status: 'migrated',
        priority: 'low',
        isCompleted: false,
        order: 5,
      },
    ];

    for (const t of tasksData) {
      await prisma.task.create({
        data: {
          date: dateStr,
          ...t,
        },
      });
    }

    // Daily Note
    await prisma.dailyNote.upsert({
      where: { date: dateStr },
      update: {},
      create: {
        date: dateStr,
        content: `Remarque sur l'éclairage :
The morning southern sunlight penetrates the gallery plaster with remarkable clarity between 09:30 and 11:15. We must position the patinated bronze studies strictly along this natural optical axis to catch the high cast shadow.

• Collect archival Japanese mulberry paper rolls from customs warehouse.
• Affix wax seal matrix and verify dry embossed crest for collector folios.`,
        quote: 'A room is not a room without natural light.',
        quoteAuthor: 'Louis Kahn',
      },
    });
  }

  // Seed reference date
  await seedDay('2025-10-15', true);

  // Seed today's date
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  if (todayStr !== '2025-10-15') {
    await seedDay(todayStr, false);
  }

  // 3. Seed Personal Notes
  const sampleNotes = [
    {
      title: 'Chapter XIII · Autumnal Ledger: On Paper & Ink',
      category: 'Philosophy',
      paperStyle: 'ruled',
      isPinned: true,
      content: `“The vitality of any stone carving resides in its subtle rejection of mechanical precision. When the chisel hesitates, humanity enters the masonry.”
— Carnet d'un Tailleur de Pierre, 1842

Walking past the old stone cloister at dusk; the rain had saturated the limestone to a deep slate grey. Noticed how the shadow cast by the archway softened before extinguishing completely into the evening fog. In such liminal daylight, form abandons rigid geometry and yields directly to texture.

Observed an intriguing quality in our freshly sized vellum leaves: the rag paper absorbs iron-gall strokes without feathery bleeding, preserving the hairline upstrokes of the nib cleanly. There is immense sanctuary in this measured friction between pen and paper.`,
    },
    {
      title: 'Bespoke Binding Specifications (1782 Folio Restoration)',
      category: 'Archive',
      paperStyle: 'grid',
      isPinned: false,
      content: `Ex-Libris Citation:
Consider the binding of the 1782 folio: pigskin over oak boards, blind-tooled fillet along the perimeter. The paper retains its crisp snap despite two centuries of alpine humidity. We must request equivalent rag stock from the Fabriano mills.

Materials Required:
1. Pure unbleached linen sewing tape (15mm).
2. Bone glue cooked at 65°C with 5% glycerin for flexibility.
3. Natural vegetable-tanned Morocco goatskin in deep Burgundy #200200.`,
    },
    {
      title: 'Arabic Epistolary & Calligraphic Registers',
      category: 'Editorial',
      paperStyle: 'ruled',
      isPinned: false,
      content: `تأملات في جودة الورق القطني ومحبرة السيبيا:
إن الورق غير المصقول يمنح ريشة الخطاط ثباتاً ووقاراً لا تبلغه الأوراق المصقولة آلياً. يمتص الحبر بتدرج طبيعي يحفظ نقاء الخطوط الدقيقة وحمرة الختم الشمعي التقليدي.

«العمارة سكون مقروء، والكتاب عمارة مطوية بين دفتين.»`,
    },
  ];

  for (const n of sampleNotes) {
    await prisma.note.create({ data: n });
  }

  // 4. Seed Weekly Plan
  const mondayThisWeek = format(today, 'yyyy-MM-dd');
  await prisma.weeklyPlan.upsert({
    where: { weekStartDate: '2025-10-13' },
    update: {},
    create: {
      weekStartDate: '2025-10-13',
      title: 'Semaine 42 · L’Automne & Conservation',
      goals: JSON.stringify([
        {
          id: '1',
          text: 'Finalize the monograph translation manuscript for Éditions Gallimard',
          isCompleted: true,
          position: 1,
        },
        {
          id: '2',
          text: "Curate binding leather specimens and marbled endpapers for 2026 Collector's Folio",
          isCompleted: false,
          position: 2,
        },
        {
          id: '3',
          text: 'Horological review with Atelier Genevois regarding tourbillon escapement calibration',
          isCompleted: false,
          position: 3,
        },
      ]),
      notes:
        'Coordinate with Fabriano paper mill for archival rag supply shipment. Keep studio climate strictly at 45% relative humidity.',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
