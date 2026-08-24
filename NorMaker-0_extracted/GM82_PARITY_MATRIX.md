# مصفوفة اختبار مطابقة GM8.2 لنواة NOR Maker 0.1

## مبدأ الاعتماد
لا تُعلن المطابقة الكاملة إلا إذا اجتازت النواة جميع الاختبارات التالية على الأقل. نجاح البناء أو وجود JNI symbols لا يُعد اختبار parity.

| المجال | ملف/مدخل الاختبار | النتيجة المطلوبة | الحالة الحالية |
|---|---|---|---|
| GMK header | `IA.gmk` | قبول الترويسة `gm82` وقراءة version/appId دون انحراف | مُختبر؛ الترويسة/version مقروءان بلا استثناء خارجي |
| GMK resources | `IA.gmk` | استخراج counts وnames وraw payload لكل Sounds/Sprites/Backgrounds/Paths/Scripts/Fonts/Timelines/Objects/Rooms | جزئي؛ counts/headers ثابتة للعينة، action/resource-tree decoding غير مكتمل |
| GMK rooms | `IA.gmk` | استيراد room metadata وbackground layers وviews وinstances وtiles ثم عرضها وتعديلها | parser الغرفة أعيد تفعيله؛ اختبار الجهاز غير منفذ |
| GMK objects/events | `IA.gmk` | حفظ كل main/sub events وactions والـ arguments دون إسقاط | غير مكتمل |
| GMK alternate | `shotgun.gmk` | نفس دورة الاستيراد دون `undefined.some` أو typed-array length سالب | مُختبر؛ offsets للقوائم ثابتة ولا يوجد استثناء parser خارجي، مع تحذيرات action/metadata |
| GMX XML | `build_test/gmz_serializer_fixture` | قراءة project.gmx وجميع XML resources مع الحفاظ على IDs والروابط | جزئي |
| GMZ ZIP | `build_test/fixture.gmz` | فك entries المخزنة وdeflate method 8، منع path traversal، ثم إعادة بناء قابلة للفك | فك deflate أضيف؛ round-trip كامل غير مثبت |
| NOR | `build_test/gmz_roundtrip` | استيراد وتصدير NOR الأصلي مع حفظ الموارد والإعدادات | غير مثبت؛ writer الحالي صيغة مخصصة |
| Runtime | مشروع اختبار صغير | create → step → collision → room switch → destroy مع حالة قابلة للمقارنة | smoke test أصلي فقط؛ جهاز فعلي غير متاح |
| GML VM | حزمة دوال GM8.2 | نتائج متطابقة للمتغيرات، scopes، arguments، instances، rooms، collision، alarms، events | جزئي؛ lexer/parser/VM يدعم while وfor وrepeat وdo-until وswitch/case/default وbreak/continue وternary وshort-circuit، واختبارات switch وdo-until ناجحة، بينما parity الشاملة للدوال والأحداث والموارد لم تُثبت |
| NES export | مشروع platformer | ROM iNES تعمل على emulator، وتستخدم sprites/rooms/events الفعلية | قالب header فقط؛ غير مكتمل |
| GBC export | مشروع platformer | ROM Game Boy تعمل على emulator مع tiles/sprites/game loop فعلية | قالب 32 KiB؛ غير مكتمل |
| GBA export | مشروع platformer | ROM ARM7TDMI قابلة للتشغيل مع assets/game loop فعلية | bootstrap محدود؛ غير مكتمل |
| Android package | APK release/debug | توقيع صحيح، فتح المشروع، استيراد، تشغيل runtime، تصدير | Debug multi-ABI بُني بنجاح بعد إضافة do-until؛ توقيع/تثبيت على جهاز غير متاحين في البيئة |

## معيار الإغلاق
يجب أن يحتوي كل صف على artifact أو log قابل للمراجعة، وأن تكون أخطاء parser قابلة للتحديد بالقسم والoffset، لا برسالة عامة فقط. ويجب تشغيل ROM الناتجة على محاكي المنصة أو اختبار signature/header مع تنفيذ فعلي للـ entrypoint، وليس فحص حجم الملف فقط.


## GMK/GM82 format audit — 2026-08-21

- **تم إصلاحه:** `nor_import_format_native` يميز الآن GMK binary صالحاً برمز format مستقل (3) بعد التحقق من magic وversion، بدلاً من معاملته كملف G عام/ROM.
- **تم اختبارُه:** `build_test/gmk_format_detect_test.c` نجح برسالة `GMK_FORMAT_DETECT_PASS`.
- **تم البناء:** APK Debug متعدد ABI نجح بعد تعديل `nor_format_native.c`، مع حفظ السجل في `build_test/gmk_import_export_android_build.log`.
- **ما زال غير مغلق:** GMK binary project import الكامل، GMK writer، تحويل كل الموارد إلى Project IR، GMX serializer البنيوي، وواجهة Android الكاملة للاستيراد/التحرير/التصدير.
- **ملاحظة:** هذا الإصلاح يمنع misclassification فقط؛ ولا يُعد دليلاً على GMK parity كاملة.


## GMK snapshot import — 2026-08-21

أضيفت واجهة JNI وJava باسم `nativeImportGmkSnapshot(byte[], String)` لحفظ `project.gmk.raw` وإنشاء `project.gmk.ir.json` وفق schema `nor-maker.gmk-snapshot.v1`. يحافظ المسار على الملف الخام ويكتب magic/version/size وتحذير الحالة، لكنه يعلن `complete:false` عمداً لأن فك الموارد إلى IR القابل للتحرير لم يكتمل بعد.

تم بناء APK Debug متعدد ABI بنجاح بعد إضافة الواجهة. هذا الإغلاق جزئي: يثبت مسار حفظ غير متلف وواجهة import واضحة، ولا يثبت GMK project import الكامل أو GMK binary export.


## GMK/GMX writers — 2026-08-21

تم تنفيذ `nor_export_gmk_raw_native` مع فحص GMK header ونسخ binary byte-for-byte، وتم تنفيذ `nor_export_gmx_semantic_native` لإنشاء XML manifest دلالي مع escaping وجرد الملفات. نجح `gmk_gmx_writer_test.c` ونجح Android `assembleDebug` لجميع ABI. التصنيف ما زال جزئياً: GMK writer لا يعيد بناء resource blocks، وGMX manifest ليس native GMX 1.x resource schema، ولم يثبت فتح الناتج في GM8.2.

## GMK payload decoder update — 2026-08-22

تم توسيع قارئ GMK native لفك metadata الدلالية للموارد ذات schema المثبتة: Sounds وSprites وBackgrounds وScripts وObjects/Events/Actions. أظهر fixture المحلي حقولاً decoded فعلية، بما في ذلك script code وsprite/object IDs وعدد الأحداث والأفعال، ونجح الاختبار `GMK_RESOURCE_MANIFEST_PASS` مع `bytesConsumed == bytesTotal`. ما يزال ذلك لا يثبت تغطية جميع إصدارات GM8.2 أو فتح ملف ناتج في GM8.2؛ payloads غير المطابقة تحفظ كـ `partial/raw-preserved`.

نتيجة الجولة: **native host decoder regression passed**. إعادة بناء APK لم تُثبت في هذه الجولة بسبب نقص ملفات Gradle/Android scaffold في workspace الحالي.

التصنيف: **GMK payload decoding — partial, tested on synthetic fixture; real-file coverage pending**.
