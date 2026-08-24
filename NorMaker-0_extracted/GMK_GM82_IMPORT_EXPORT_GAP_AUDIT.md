# تدقيق استيراد وتصدير GMK/GM82 في NOR Maker 0.1

## النتيجة المختصرة

المسار الحالي لا يحقق توافق GMK/GM82 الكامل. دعم GMK الموجود في `gm82_android_core.c` تشخيصي في الأساس: التحقق من magic/version، إنتاج metadata/layout، ومسح chunks محتملة. لا توجد في طبقة Android الحالية عملية تبني Project IR قابلاً للتحرير من جميع موارد GMK، ولا يوجد GMK writer يعيد إنشاء ملف binary أصلي.

## ما هو موجود فعلياً

| المسار | التنفيذ الحالي | الحكم |
|---|---|---|
| GMK header | `valid_gmk_header` يتحقق من magic وversion ضمن نطاق محدد | فحص ترويسة فقط |
| GMK metadata/layout | JNI helpers تعرض معلومات أولية مثل magic/version/appId/settings/compression | تشخيص، وليس استيراد مشروع |
| GMK chunk inventory | مسح chunks وأحجامها/عدّها | تشخيص غير كافٍ لحفظ الموارد |
| GMX/GMZ import | ZIP extractor يدعم stored وraw deflate، مع path traversal checks | استخراج ملفات، وليس فهم GMX resource semantics |
| GMZ export | ضغط مجلد إلى ZIP مع central directory | round-trip أرشيفي عام فقط |
| GMX export | واجهة Java تعلن الخيار، لكن backend native يقبل `gmz` فقط | غير منفذ فعلياً |
| NOR/PNOR export | غلاف نصي مخصص يبدأ بـ `NOR:` | ليس serializer لصيغة GMK/GM82 |
| GMK export | لا يوجد writer binary فعلي في `nor_format_native.c` أو واجهة JNI مخصصة | مفقود بالكامل |

## الفجوات التي تمنع الإغلاق

يجب تنفيذ قارئ GMK binary كامل يقرأ resource lists والـ payloads والـ IDs والأسماء والـ references، ثم يحولها إلى Project IR موحد. ويجب فك objects/events/actions/arguments وrooms/instances/tiles/views/background layers وsettings وcreation code، مع تسجيل offset وlength لكل خطأ.

بعد ذلك يلزم writer GMK حقيقي يكتب البنية الثنائية المطلوبة بإصداراتها ومواردها وترتيبها، أو قرار توافق موثق يحدد صيغة تصدير بديلة. إعادة تغليف البيانات في JSON أو ZIP أو `NOR:` لا تعتبر GMK export.

كما يجب استكمال GMX serializer البنيوي، بحيث تُكتب ملفات XML الصحيحة لكل resource بدلاً من ضغط مجلد عام فقط. يجب أن يطابق round-trip شجرة الموارد والـ IDs والخصائص والروابط، لا مجرد وجود الملفات بعد فك الضغط.

تحتاج واجهة Java وTypeScript إلى مسارين صريحين: `importGmkToProject` و`exportProjectToGmk`، مع نتائج structured تتضمن warnings/errors/resources، بدلاً من توجيه GMK إلى مسار GMX/GMZ أو معاملته كملف ROM عام.

## معايير القبول

1. استيراد عينات GMK متعددة الإصدارات دون crash أو إسقاط resource.
2. ظهور كل الموارد في Project IR مع IDs وروابط قابلة للمقارنة.
3. تعديل مورد ثم حفظه وإعادة فتحه دون فقدان غير مقصود.
4. GMK export ينتج ملفاً تقبله أداة GM8.2 أو قارئ مرجعي، وليس ملفاً مخصصاً متنكرًا.
5. GMX/GMZ round-trip دلالي كامل للموارد المدعومة.
6. وجود اختبارات negative للملفات المبتورة، offsets غير الصحيحة، compression غير المدعوم، وpath traversal.
7. اختبار Android فعلي للاستيراد والتحرير والتصدير، لا بناء APK فقط.

## الخطوة التنفيذية الآمنة التالية

الأولوية هي بناء `gmk_project_import` يحول كل قسم معروف إلى IR مع resource offsets وraw payload محفوظ، ثم إضافة fixtures واختبار inventory مقابل IR. بعد نجاح الاستيراد الكامل يمكن بناء writer GMK من IR. لا ينبغي اختلاق writer قبل تثبيت schema الثنائية لكل مورد، لأن ذلك ينتج ملفات تبدو مصدّرة لكنها غير قابلة للفتح في GM8.2.
