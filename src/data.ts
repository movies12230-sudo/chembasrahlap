import { Product } from './types';

export const products: Product[] = [
  {
    id: 'cream',
    name: 'كريم مرطب (Moisturizing Cream)',
    type: 'Cream',
    minPH: 4.5,
    maxPH: 5.5,
    ingredients: [
      { name: 'ماء منزوع الأيونات', amount: 70 },
      { name: 'جلسرين', amount: 5 },
      { name: 'زيوت نباتية', amount: 10 },
      { name: 'زبدة الشيا', amount: 5 },
      { name: 'مستحلب (Cetearyl Alcohol/Glyceryl Stearate)', amount: 8 },
      { name: 'مادة حافظة (Phenoxyethanol)', amount: 0.8 },
      { name: 'فيتامين E', amount: 0.2 },
    ],
  },
  {
    id: 'pore_gel',
    name: 'جل قابض للمسام (Gel)',
    type: 'Gel',
    minPH: 4.5,
    maxPH: 6.0,
    ingredients: [
      { name: 'ماء مقطر', amount: 88 },
      { name: 'كربومير 940', amount: 0.8 },
      { name: 'جلسرين', amount: 8 },
      { name: 'ثلاثي إيثانول أمين (TEA)', amount: 0.4 },
      { name: 'فيتامين B5 (بانثينول)', amount: 2 },
      { name: 'مادة حافظة', amount: 0.8 },
    ],
  },
  {
    id: 'wash',
    name: 'غسول تنظيف (Cleanser)',
    type: 'Wash',
    minPH: 4.5,
    maxPH: 6.5,
    ingredients: [
      { name: 'ماء مقطر', amount: 78 },
      { name: 'تكسابون (SLES)', amount: 10 },
      { name: 'بيتاين (Cocamidopropyl Betaine)', amount: 8 },
      { name: 'جلسرين', amount: 3 },
      { name: 'مادة حافظة', amount: 0.8 },
      { name: 'عطر', amount: 0.2 },
    ],
  },
  {
    id: 'toner',
    name: 'تونر مرطب (Toner)',
    type: 'Toner',
    minPH: 4.0,
    maxPH: 5.5,
    ingredients: [
      { name: 'ماء ورد (Hydrosol)', amount: 88 },
      { name: 'جل صبار', amount: 9 },
      { name: 'جلسرين', amount: 2 },
      { name: 'فيتامين E', amount: 0.2 },
      { name: 'مادة حافظة', amount: 0.8 },
    ],
  },
];
