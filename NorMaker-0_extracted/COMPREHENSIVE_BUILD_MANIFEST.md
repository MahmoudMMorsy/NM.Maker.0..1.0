# NOR Maker 0.1 — Comprehensive Android Build Manifest

## قرار الدمج

تمت مراجعة كل ملفات APK والأرشيفات الموجودة في مساحة العمل. النسخة المصدرية المعتمدة للدمج هي `android_project_base` الحالية، لأنها تحتوي على أكبر وأحدث مجموعة متسقة من ملفات النواة والواجهة وملفات التحقق، كما أن APK الناتج منها يضم ABI التالية: `arm64-v8a` و`armeabi-v7a` و`x86` و`x86_64`.

لم يتم استبدال ملفاتها بنسخ أقدم من الأرشيفات؛ المقارنة الثنائية أثبتت أن الأرشيفات السابقة تحتوي إصدارات أقدم من `gm82_android_core.c` و`gm82_gmk_reader.c` و`nor_format_native.c` أو نسخًا جزئية من النواة. لذلك فإن الدمج الآمن هو اعتماد المصدر الحالي مع الاحتفاظ بكل الأرشيفات القديمة كمرجع قابل للرجوع، وليس خلطها فوق النسخة الحالية.

## ما تم جمعه في النسخة الشاملة

| المجال | الحالة المدمجة |
|---|---|
| واجهة NOR Maker WebView والموارد المرئية | موجودة في `app/src/main/assets/www` |
| النواة native وJNI | موجودة في `app/src/main/cpp` و`MainActivity.java` |
| GML lexer/parser/VM واختبارات control-flow المتاحة | مدمجة، مع اختبارات `switch` و`do-until` و`invoke/scope` |
| قارئ GMK وProject IR وresource manifests | مدمج جزئيًا ومختبر على fixtures المتاحة |
| Room metadata/instances/tiles/views guards | مدمج جزئيًا مع اختبارات regression محلية |
| GMX/GMZ import/export ومسار XML semantic writer | مدمج كمسار native جزئي مع حفظ الموارد والـ payloads المتاحة |
| إصلاحات Android input وwindow focus | مدمجة في Java/JNI الحالية |
| ملفات corpus ونتائج التحقق وOpenGMK notices | موجودة داخل `assets/core_validation` و`assets/third_party` |
| APK متعدد ABI | بُني بنجاح من المصدر الحالي |

## ما لم يتم ادعاء اكتماله

التوافق الكامل مع GM8.2 غير مثبت بعد. فك كل payloads الخاصة بـ Objects/Events/Actions وجميع موارد GMK، وكتابة GMK binary native كاملة، وفتح الناتج فعليًا في GameMaker 8.2، وround-trip GMZ/GMX كامل، واختبارات جهاز Android فعلي، وROM exporters الحقيقية لـ NES/GBC/GBA، ما زالت فجوات معلنة وليست مكونات يمكن جمعها من النسخ القديمة دون اختلاق.

ملف `retro_rom_native.c` الحالي fail-closed ويحتوي على واجهة تمهيدية، لذلك لم يُعلن عن ROM قابلة للتشغيل. كما أن APK الناتج Debug للاختبار وليس إصدار Release موقّعًا للنشر.

## الأدلة الناتجة من المراجعة

- `build_test/full_version_inventory.tsv`: جرد APKs والأرشيفات والبصمات.
- `build_test/archive_contents.txt`: محتويات الأرشيفات السابقة.
- `build_test/source_diff_summary.txt`: فروق ملفات النواة بين الأرشيفات والمصدر الحالي.
- `build_test/merge_decision_evidence.txt`: مؤشرات الميزات والفجوات.
- `GM82_PARITY_MATRIX.md`: مصفوفة التوافق التفصيلية.
- `RUNTIME_TEST_MATRIX.md`: مصفوفة اختبارات runtime.

## نتيجة الاختيار

النسخة الشاملة المعتمدة هي نسخة المصدر الحالية المبنية من `android_project_base`. النسخ السابقة محفوظة كـ snapshots للمقارنة وليست مصادر أحدث. أي تطوير لاحق يجب أن يبدأ من هذه النسخة، مع إضافة اختبارات وميزات جديدة تدريجيًا وعدم نسخ ملفات أقدم فوقها إلا بعد اختبار binary وsemantic واضح.
