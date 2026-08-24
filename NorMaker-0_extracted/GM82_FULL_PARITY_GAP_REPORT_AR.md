# الفجوات المتبقية للوصول إلى توافق GM8.2 الكامل

## الخلاصة التنفيذية

الوضع الحالي ليس نواة GM8.2 كاملة، بل نواة Android native متقدمة ذات دعم جزئي ومدعوم باختبارات محددة. البناء متعدد ABI، وواجهة JNI، وبعض اختبارات GML وGMK تعمل، لكن ذلك لا يساوي توافقًا سلوكيًا أو صيغيًا كاملًا مع GameMaker 8.2. معيار التوافق التام يجب أن يكون: **استيراد مشروع حقيقي، تحويله إلى تمثيل داخلي دلالي، تشغيله، تعديله، تصديره، ثم إعادة فتحه مع عدم وجود فروق دلالية غير مقصودة**.

> وجود APK صالح أو رموز JNI صحيحة يثبت سلامة الحزمة والتكامل الأساسي فقط، ولا يثبت parity مع محرك Windows.

## 1. فجوة صيغة GMK الثنائية

### الوضع الحالي

القارئ `gm82_gmk_reader.c` يتحقق من الترويسة والإصدار، يقرأ بعض الإعدادات وأسماء الموارد وأحجام الكتل، ويفك بعض حالات XOR وdeflate. كما يستطيع إنتاج manifest جزئي وحفظ البيانات الخام عند عدم معرفة layout. لكن عند اختلاف ترتيب الموارد أو تخطيط payload عن الـ fixture المعروف ينتقل إلى `parseStatus: partial`. هذا يعني أن البيانات قد تُحفظ، لكنها لا تتحول كلها إلى موارد قابلة للتحرير.

### ما ينقص

يلزم تعريف قارئ كامل لكل أقسام GM8.2: الإعدادات، Sounds، Sprites، Backgrounds، Paths، Scripts، Fonts، Timelines، Objects، Rooms، game information، وخصائص المشروع. ويجب حفظ `offset` و`length` و`version` و`resource_id` و`name` و`references` لكل عنصر، مع إبقاء bytes غير المعروفة حتى لا تتلف المشاريع التي تحتوي خصائص لم تُفك بعد.

### طريقة السد

ينبغي بناء طبقة `gmk_project_import` منفصلة عن JNI. الطبقة تقرأ الملف إلى `Project IR` موحد، ولكل مورد decoder خاص به. لا يصح استخدام تخمينات تعتمد على الحجم فقط؛ كل decoder يجب أن يملك bounds checks ونسخة layout واضحة واختبار fixture. عند فشل decoder، يسجل الخطأ في المورد والقسم والـ offset ويحتفظ بالـ raw payload بدل إسقاطه.

### معيار الإغلاق

يُعتبر هذا الجزء مغلقًا فقط عندما تستورد عينات GMK حقيقية متعددة، وتظهر كل الموارد في IR مع IDs وروابط صحيحة، ويكون مجموع bytes المقروءة معروفًا، وتنجح اختبارات الملفات المبتورة وoffsets غير الصحيحة بدون crash أو قراءة خارج الحدود.

## 2. فجوة Objects وEvents وActions

### الوضع الحالي

تمت إضافة قراءة جزئية لعدادات objects والأحداث والأفعال وبعض metadata، لكن لا يوجد ضمان أن كل main events وsub-events والأفعال وarguments تُفك وتحفظ بالترتيب والخصائص نفسها. هذه الفجوة تمنع تشغيل مشاريع GM8.2 المعتمدة على drag-and-drop actions حتى لو كانت شجرة الموارد ظاهرة.

### ما ينقص

يجب دعم event types وsub-event numbers، execution order، action library/type، relative flags، not flag، applies-to، arguments النصية والرقمية والمواردية، وcreation/destroy/step/alarm/collision/keyboard/mouse/other events. يجب أيضًا التمييز بين code actions وbuilt-in actions، وعدم تحويل action غير المعروفة إلى نص فارغ.

### طريقة السد

إنشاء نموذج IR صريح مثل `ObjectIR → EventIR → ActionIR → ArgumentIR`. يحفظ `raw_action_payload` بجانب الحقول المفكوكة. بعد ذلك يضاف dispatcher في runtime يحول ActionIR إلى عمليات VM أو callbacks native. الأفعال التي لا يدعمها runtime تسجل warning محددًا مع اسم الفعل ومكانه، ولا تُحذف عند التصدير.

### معيار الإغلاق

إنشاء fixtures منفصلة لكل نوع event ومجموعة actions، ثم مقارنة شجرة object قبل وبعد `import → IR → export → re-import`. يجب أن يتطابق عدد الأحداث والأفعال والarguments والروابط، مع تنفيذ runtime لعينة تشغيلية من كل فئة.

## 3. فجوة Rooms وInstances وTiles وViews

### الوضع الحالي

يوجد decoder جزئي لتفاصيل الغرفة، وبعض اختبارات room detail وtruncation guards. لكنه لا يثبت حفظ كل خصائص الغرفة وتعديلها وإعادة بنائها. كما أن الاختبار المحلي لا يعادل اختبار عرض الغرفة على جهاز Android فعلي.

### ما ينقص

يلزم دعم room dimensions، speed، persistent، creation code، backgrounds/layers، views، follow settings، instances، creation order، scale/rotation، image speed، colour/alpha، tiles، depth، blend، visibility، وroom transitions. يجب ربط object IDs وsprite/background IDs وinstance IDs دون إعادة ترقيم غير مقصودة.

### طريقة السد

استخدام `RoomIR` منفصل عن renderer. يُحفظ ترتيب العناصر كما في الملف، وتُستخدم IDs ثابتة مع جدول references validation. يضاف renderer test ينتج snapshot موحدًا، ثم Android instrumentation test يفتح الغرفة ويعرضها ويغيرها ويعيد حفظها. يجب أن تدعم دورة `create → step → collision → room switch → destroy` تنظيف كل الموارد.

### معيار الإغلاق

مقارنة snapshot دلالي قبل وبعد الاستيراد والتصدير، واختبار غرفة تحتوي على views وtiles وinstances وbackground layers، ثم تشغيلها على arm64 وarmeabi-v7a في Release بدون تسرب أو crash.

## 4. فجوة GMK writer الحقيقي

### الوضع الحالي

`nor_export_gmk_raw_native` ينسخ GMK صالحًا byte-for-byte فقط. هذا مفيد للحفظ غير المتلف، لكنه ليس writer يعيد بناء مشروع بعد التعديل. إعادة تغليف الملف في JSON أو ZIP أو `NOR:` ليست GMK export.

### ما ينقص

يجب كتابة الترويسة، version، settings، resource tables، payload blocks، IDs، names، references، compression/encryption، offsets، وترتيب الأقسام بنفس layout المقبول من GM8.2. كما يجب تحديد استراتيجية الحفاظ على unknown chunks.

### طريقة السد

لا يبدأ writer قبل تثبيت schema القارئ. المسار الصحيح هو:

`GMK → complete IR + raw unknown chunks → تعديل → writer → GMK جديد → re-import`.

ينبغي وجود golden fixtures وbyte-level tests للأجزاء المعروفة، وsemantic tests للأجزاء التي قد تختلف بايتاتها بسبب compression أو ترتيب داخلي. يجب أيضًا تشغيل الملف الناتج على GameMaker 8.2 الفعلي أو قارئ مرجعي موثوق.

### معيار الإغلاق

قبول الملف الناتج في GM8.2، وفتح المشروع وتحريره وحفظه، ثم إعادة استيراده في NOR Maker دون فقد الموارد أو الأحداث أو الروابط. لا يكفي نجاح `sha256` أو حجم الملف.

## 5. فجوة GMX وGMZ

### GMX

الكاتب الحالي ينشئ manifest XML خاصًا بـ NOR Maker، مع XML escaping وجرد للملفات. لكنه ليس schema native لـ GMX 1.x ولا يكتب ملفات الموارد النوعية المطلوبة من GameMaker Studio. يجب كتابة XML منفصل لكل sprite وsound وbackground وobject وroom وscript وsettings وفق schema الصحيحة، مع paths وIDs والروابط والخصائص المطلوبة.

### GMZ

الاستيراد والتصدير الحاليان يدعمان استخراج ZIP والتعامل مع stored وdeflate وبعض حماية path traversal. هذا يثبت طبقة أرشفة، لا round-trip دلاليًا كاملًا. يجب أن يحتوي GMZ على GMX وملفات الموارد الصحيحة، وأن يُعاد فكّه ثم مقارنة Project IR لا مجرد مقارنة قائمة الملفات.

### معيار الإغلاق

`GMX/GMZ import → IR → export → import` مع صفر فروق دلالية في resource tree وIDs وreferences وخصائص الموارد المدعومة، واختبار ملفات path traversal وcompression غير المدعوم والملفات المبتورة.

## 6. فجوة GML language وruntime parity

### الوضع الحالي

يدعم VM الحالي جزءًا معتبرًا من البنية: while وfor وrepeat وdo-until وswitch/case/default وbreak/continue وternary وshort-circuit وبعض motion/math/collision وinstance/room hooks. توجد اختبارات ناجحة لـ switch وdo-until وinvoke/scope. لكن التوافق الشامل للدوال، types، scopes، events، resources، alarms، arrays، strings، errors، evaluation order، وbuilt-ins لم يُثبت.

كما أن بعض المسارات في `gm82_android_core.c` تستخدم fallback قديمًا قائمًا على `sscanf` عند فشل مسار VM الكامل؛ هذا قد يجعل السلوك مختلفًا عن GML الحقيقي ويخفي أخطاء parser.

### ما ينقص

يلزم استكمال lexer/parser/AST semantics، ثم تغطية built-ins حسب الفئات: variables and scope، strings، arrays، math، movement، collision، instances، rooms، sprites، sounds، alarms، drawing، file/INI، data structures، dates، particles، keyboard/mouse، debugging، وerror behavior. يجب توثيق الفروق المقصودة فقط، لا اعتبار fallback توافقًا.

### طريقة السد

بناء جدول built-ins مركزي يربط الاسم بالتوقيع والـ argument count والـ coercion والـ return type والـ side effects. توحيد execution داخل VM وإزالة fallback تدريجيًا بعد إضافة parser support. لكل function fixture صغير يقارن القيمة والآثار الجانبية وترتيب التقييم مع GM8.2.

### معيار الإغلاق

اجتياز corpus من scripts حقيقية، مع نتائج golden snapshots متطابقة. يجب اختبار global/local/self/other/all، argument variables، instance context، error cases، floating-point edge cases، string coercion، alarm/event ordering، وcollision masks.

## 7. فجوة دورة runtime والأحداث

يجب إثبات ترتيب Create ثم Begin Step ثم Step ثم End Step ثم Draw/Collision/Alarm وفق سلوك GM8.2، إضافة إلى room start/end، destroy، inheritance، persistent instances، depth/order، وعمليات instance_create وinstance_find وinstance_destroy. كما يجب اختبار resource cleanup بعد تكرار destroy/create وعدم بقاء bitmaps أو scripts أو event code points.

معيار الإغلاق هو تشغيل مشروع اختبار مرجعي على Android، وأخذ snapshots بعد كل frame، ومقارنة counters والمواقع والـ instance lists وترتيب callbacks.

## 8. فجوة الرسومات والصوت والموارد

وجود ملفات assets داخل APK لا يعني أن runtime يفسرها بنفس طريقة GM8.2. يجب استكمال تحميل sprites وsubimages وmasks وorigins وcollision bounding boxes، وتطبيق transparency وalpha وblend وscaling وrotation. وبالنسبة للصوت، يلزم اختبار sound resources، streaming/loaded behavior، volume، looping، وcleanup.

يجب أن تكون الموارد مرتبطة بـ IDs لا بأسماء فقط، مع cache وإدارة lifetime واضحة. معيار القبول هو snapshot رسومي مرجعي واختبار تشغيل صوتي على جهاز فعلي، مع عدم تسرب الذاكرة.

## 9. فجوة Android UI وfile workflow

طبقة Java الحالية توفر file picker وJNI bridge ومعالجة key events وwindow focus. لكنها تحتاج اختبارًا عمليًا لمسار المستخدم الكامل: اختيار GMK/GMX/GMZ من التخزين، إظهار حالة الاستيراد والتحذيرات، فتح المشروع، تعديل مورد، تشغيله، ثم التصدير إلى مسار يمكن للمستخدم الوصول إليه.

يجب ألا تعرض الواجهة نجاحًا عندما تكون النتيجة `partial`. يلزم structured result يحتوي `ok`, `status`, `warnings`, `errors`, `resources`, و`outputPath`. كما يجب اختبار صلاحيات Android وSAF وملفات كبيرة وcancel وفتح ملف غير صالح.

## 10. فجوة ROM exporters

ملف `retro_rom_native.c` الحالي fail-closed؛ دوال NES وGBC وGBA التمهيدية لا تنتج ROM تشغيلية. لذلك لا يمكن اعتبار التصدير retro منجزًا.

سد الفجوة يتطلب اختيار backend مستقل لكل منصة، مع assembler/linker أو مولد machine code موثوق، linker scripts، ROM headers، memory maps، asset quantization، tile packing، palettes، object tables، game loop، input، audio، وmapper أو cartridge constraints. يجب ترجمة subset موثق من Project IR/GML إلى runtime خاص بالمنصة بدل محاولة ترجمة GML كامل مباشرة.

معيار الإغلاق هو تشغيل ROM الناتجة على محاكيات NES وGBC وGBA، والتحقق من input وcollision وroom transition وsprites والصوت، ثم مقارنة source project مع ROM manifest. هذا مسار منفصل عن GM8.2 parity ولا ينبغي استخدامه كدليل عليها.

## 11. فجوة الاختبار المرجعي

الاختبارات الحالية تثبت build، بعض JNI contracts، بعض GML control flow، وبعض GMK fixtures. لكنها لا تثبت فتح الناتج داخل GameMaker 8.2، ولا اختبار جهاز Android فعلي، ولا تغطية corpus كاملة. كما أن اختبارات manifest التي تحتاج معاملات أو fixtures لا يجوز عدّها ناجحة عند تشغيلها بلا مدخلات.

يجب بناء corpus متدرج:

| المستوى | المحتوى | معيار النجاح |
|---|---|---|
| L0 | headers وnegative files | لا crash، أخطاء محددة |
| L1 | مورد واحد لكل نوع | IR دقيق وraw preservation |
| L2 | Objects/Events/Rooms مركبة | zero semantic diff بعد round-trip |
| L3 | مشاريع GM8.2 حقيقية | فتح وتشغيل وتصدير فعلي |
| L4 | Android devices وRelease | سلوك ثابت، لا JNI crash أو leak |

ينبغي تشغيل ASan وUBSan على host، واختبار Release على arm64 وarmeabi-v7a، وتسجيل الجهاز وABI وإصدار Android لكل نتيجة.

## ترتيب التنفيذ الصحيح

| الأولوية | العمل | السبب |
|---:|---|---|
| 1 | تثبيت Project IR وGMK import الكامل | كل writer وruntime يعتمدان عليه |
| 2 | فك Objects/Events/Actions وRooms | هذه أكثر الأجزاء تأثيرًا في تشغيل اللعبة |
| 3 | توحيد GML VM والـ built-ins وإزالة fallback | منع اختلاف السلوك الصامت |
| 4 | إكمال resource manager والرسومات والصوت | تحويل IR إلى runtime حقيقي |
| 5 | بناء GMX/GMZ semantic round-trip | مسار عملي قابل للاختبار قبل GMK writer |
| 6 | بناء GMK writer native | يحتاج schema مستقرة وfixtures حقيقية |
| 7 | Android end-to-end وRelease/device tests | إغلاق فجوة البيئة الفعلية |
| 8 | ROM backends NES/GBC/GBA | مشروع تصدير مستقل بمتطلبات منصة مختلفة |

## ما لا ينبغي فعله

لا ينبغي الإعلان عن 100% اعتمادًا على حجم APK أو عدد JNI exports أو نجاح `assembleDebug`. ولا ينبغي نسخ ملفات من APK أقدم فوق المصدر الحالي لمجرد أن حجمه أكبر. كما لا ينبغي كتابة GMK أو GMX شكليًا قبل تثبيت schema؛ فالملف الذي يبدو صحيحًا قد لا يفتح في GM8.2.

## تعريف الإغلاق النهائي

يُغلق المشروع فقط عندما تتوفر ثلاثة أدلة مستقلة: أولًا، round-trip دلالي كامل على corpus GM8.2 حقيقي؛ ثانيًا، فتح وتشغيل وتعديل الناتج داخل GameMaker 8.2 أو قارئ مرجعي متوافق؛ وثالثًا، اختبار Android فعلي على ABI وأجهزة متعددة مع ASan/UBSan وقياس أداء correctness منفصل عن performance. حتى ذلك الحين، الوصف الدقيق هو: **دعم Android native متقدم وجزئي لـ GMK/GML/GMX/GMZ، وليس توافقًا تامًا**.

## مراجع المشروع

[1]: `GM82_PARITY_MATRIX.md` — مصفوفة التوافق الحالية.
[2]: `GMK_GM82_IMPORT_EXPORT_GAP_AUDIT.md` — تدقيق فجوات GMK/GMX/GMZ.
[3]: `GMK_NATIVE_CORE_IMPLEMENTATION_REPORT.md` — حدود قارئ GMK الحالي.
[4]: `GMK_GMX_WRITER_IMPLEMENTATION_REPORT.md` — حدود الكتابة الحالية.
[5]: `RUNTIME_TEST_MATRIX.md` — حالات قبول runtime.
[6]: `android_project_base/app/src/main/cpp/gm82_gmk_reader.c` — decoder الحالي.
[7]: `android_project_base/app/src/main/cpp/nor_format_native.c` — import/export الحالي.
[8]: `android_project_base/app/src/main/cpp/retro_rom_native.c` — حالة ROM exporters.
[9]: `android_project_base/app/src/main/cpp/gm82_android_core.c` — JNI/runtime bridge.
