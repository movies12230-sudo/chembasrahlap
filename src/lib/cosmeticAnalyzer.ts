import { Product, SkinType } from '../types';

export function generateClientSideAnalysis(product: Product, ingredients: { name: string; amount: number }[], skinType: SkinType): string {
  // Simple check for key ingredients
  const getIngredientAmount = (name: string) => ingredients.find(ing => ing.name === name || ing.name.includes(name))?.amount || 0;

  const water = getIngredientAmount('ماء');
  const glycerin = getIngredientAmount('جلسرين');
  const oils = getIngredientAmount('زيوت') + getIngredientAmount('شيا');
  const sles = getIngredientAmount('تكسابون');
  const betaine = getIngredientAmount('بيتاين');
  const preservative = getIngredientAmount('مادة حافظة');
  const vitE = getIngredientAmount('فيتامين E');
  const panthenol = getIngredientAmount('بانثينول') || getIngredientAmount('B5');
  const carbomer = getIngredientAmount('كربومير');
  const tea = getIngredientAmount('ثلاثي إيثانول');

  let report = `🔬 تقرير التوافق الكيميائي للتركيبة: [${product.name}] لـ [البشرة ${skinType}]

📈 1. معايير الأمن والثبات الكيميائي:
`;

  // Standard Preservative Check
  if (preservative === 0) {
    report += `❌ خطر ميكروبيولوجي: التركيبة تخلو تماماً من أي مادة حافظة! هذا يهدد استقرار ومظهر المنتج ويسمح بحدوث تعفن في غضون أيام قليلة. يجب إضافة مادة حافظة مثل Phenoxyethanol بنسبة 0.5% - 1% فوراً.\n`;
  } else if (preservative > 1.5) {
    report += `⚠️ خطر فرط التحسس: نسبة المادة الحافظة (${preservative}%) تتجاوز الحد الآمن الموصى به كيميائياً (0.5% - 1.0%). هذا قد يسبب تهيجاً حاداً وحروقاً مجهرية لقرنية العين وحاجز البشرة الخارجي.\n`;
  } else {
    report += `✅ توازن حافظ جيد: مادة حفظ التركيبة تقع ضمن النطاق الآمن وتمنع تلوث المنتج.\n`;
  }

  // pH stability checks
  if (carbomer > 0 && tea === 0) {
    report += `⚠️ مشكلة استقرار ميكانيكي: تم استخدام كربومير لإنشاء قوام هلامي، ولكنه يحتاج إلى مادة قلوية مثل ثلاثي إيثانول أمين (TEA) لمعادلته وتحقيق اللزوجة (pH ~ 6.0). غير ذلك لن يتجمد السائل وسيبقى رقيقاً.\n`;
  } else if (carbomer > 0 && tea > 0) {
    report += `✅ ترابط بوليمري مستقر: ترابط الكربومير مع ثلاثي إيثانول أمين يمنح الجل قواماً غروياً تماسكياً ممتازاً.\n`;
  }

  // Surfactant / Cleanser compatibility
  if (product.type === 'Wash') {
    if (sles > 15) {
      report += `⚠️ تداخل كيميائي حاد: نسبة تكسابون المستعملة مرتفعة جداً (${sles}%). هذا المركب الشحني القوي يسبب نزعاً كاملاً لدهون حاجز البشرة الواقي وتشققات جلدية.\n`;
    }
    if (sles > 0 && betaine === 0) {
      report += `⚠️ تهيج التوتر السطحي: التركيبة تحوي تكسابون شحني ولكنها تفتقر للبيتاين المعتدل (Co-surfactant) لتهدئة رغوة تكسابون الخشنة وجعل جزيئاتها آمنة على الوجه.\n`;
    } else if (sles > 0 && betaine > 0) {
      report += `✅ ترابط توتر سطحي ذكي: تداخل تكسابون مع بيتاين يخلق رغوة ميسيلار كريمية تنظف الوجه بلطف وأمان.\n`;
    }
  }

  // skin compatibility analyzer
  report += `\n👤 2. ملاءمة المنتج لـ [البشرة ${skinType}]:\n`;
  
  if (skinType === SkinType.Dry) {
    if (oils < 5 && product.type === 'Cream') {
      report += `⚠️ غير ملائم: البشرة الجافة تحتاج إلى المزيد من المطريات المانعة للتبخر (Emollients) مثل زيوت نباتية أو زبدة الشيا (النسبة الحالية منخفضة جداً للترطيب الخلوي).\n`;
    } else if (oils >= 8) {
      report += `✅ ترطيب مثالي: التركيبة غنية بالمواد الفعالة الدهنية، مما يسد المسامات المجهرية للبشرة الجافة ويمنحها الليونة الفورية.\n`;
    }
    if (sles > 8) {
      report += `❌ عائق جلدي: غسول الوجه المرتكز على تكسابون بنسبة أعلى من 8% يعتبر ساماً وقاسياً على حاجز رطوبة البشرة الجافة.\n`;
    }
  } else if (skinType === SkinType.Oily) {
    if (oils > 12) {
      report += `⚠️ انسداد المسام (Comedogenic): نسبة الزيوت والمواد الدسمة الحالية (${oils}%) ثقيلة جداً للبشرة الدهنية، مما يحفز إفراز الزهم وظهور الرؤوس السوداء وحب الشباب.\n`;
    } else {
      report += `✅ حماية خفيفة: المستحلب خفيف وكثافة الزيوت مثالية لمنع تحفيز إفراز الدهون واللمعان المفرط.\n`;
    }
  } else {
    report += `✅ توازن مائي-دهني مثير للإعجاب: تركيز المكونات يناسب تماماً خلايا البشرة العادية ولا يضر بحاجز هيدروليبيديك الطبيعي.\n`;
  }

  // Active agents feedback
  report += `\n🌱 3. مغذيات للبشرة (Active Actives):\n`;
  if (vitE > 0) {
    report += `🌟 تواجد فيتامين E ممتاز لحماية الزيوت النباتية من الأكسدة والتلف وحماية خلايا البشرة من آثار الشيخوخة.\n`;
  }
  if (panthenol > 0) {
    report += `🌟 تواجد البانثينول يسرع استشفاء حاجز البشرة المتضرر، ويوفر نعومة فورية.\n`;
  }

  // Final formulation summary and compliance advice
  report += `\n🧪 4. نصيحة الصيدلة التجميلية:\n`;
  const isPhWithinLimit = (product.minPH <= 5.5 && product.maxPH >= 4.5);
  report += `• اضبط لزوجة ودرجة حامضية الطور المائي بحذر لتبقى مستقرة حول ${isPhWithinLimit ? '4.8 - 5.5' : '5.0'}.\n`;
  report += `• للتصنيع التجاري، يوصى بالتعقيم بالأشعة فوق البنفسجية للماء منزوع الأيونات قبل إضافته لخزان الخلط الرئيسي لتفادي الأبواغ الفطرية.`;

  return report;
}
