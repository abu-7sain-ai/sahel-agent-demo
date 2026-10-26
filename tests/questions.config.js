// The ten acceptance questions (constitution section 8) and what each answer must contain.
// mustInclude: every string must appear. anyOf: at least one string from each inner list must appear.
module.exports = [
  { q: 'شلون أجدد البطاقة المدنية؟', mustInclude: ['الهيئة العامة للمعلومات المدنية', 'خدمات البطاقة', 'تجديد البطاقة'], path: true },
  { q: 'أبي أطلع استمرارية زواج.', mustInclude: ['وزارة العدل'], path: true },
  { q: 'وين أدفع مخالفات المرور؟', mustInclude: ['وزارة الداخلية', 'خدمات الدفع الإلكتروني', 'دفع مخالفات المرور'], path: true },
  { q: 'شلون أجدد إقامة الخدامة؟', mustInclude: ['وزارة الداخلية', 'خدمات الإقامة', 'تجديد الإقامة'], path: true },
  { q: 'أبي شهادة لمن يهمه الأمر.', mustInclude: ['الهيئة العامة للمعلومات المدنية', 'إصدار شهادة فرد'], path: true },
  { q: 'ضاع جوازي، شسوي؟', mustInclude: ['وزارة الداخلية', 'الإبلاغ عن فقدان الوثائق'], path: true },
  { q: 'كم رسوم تجديد الجواز؟', mustInclude: ['تجديد جواز السفر الكويتي'], feeCheck: 'تجديد جواز السفر الكويتي', path: true },
  { q: 'شلون أسجل مولود جديد؟', mustInclude: ['استكمال بيانات مولود'], path: true },
  { q: 'أبي أغير عنواني.', mustInclude: ['تغيير عنوان كويتي', 'تغيير عنوان غير كويتي'], path: true },
  { q: 'وش أفضل مطعم بالكويت؟', mustInclude: ['أنا أساعد في خدمات سهل بس'], path: false },
];
