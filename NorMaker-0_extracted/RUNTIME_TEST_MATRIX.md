# مصفوفة اختبار نواة NOR Maker 0.1

## الهدف

التحقق من سلوك runtime Native عبر JNI قبل ادعاء parity أو تفوق أداء على GM8.2 Windows. كل اختبار يجب أن ينتج snapshot أو قيمة قابلة للمقارنة.

| الحالة | الإجراء | النتيجة المتوقعة |
|---|---|---|
| إنشاء runtime | `nativeRuntimeCreate(640,480)` | initialized=true، room افتراضي، counters مصفّرة |
| إنشاء instance | تسجيل object ثم `nativeRuntimeAddInstance` | id موجب، instance ظاهر في snapshot |
| استمرارية الحركة | تعيين vx/vy ثم عدة `nativeRuntimeStep` دون مفاتيح | x/y تتغير، ولا تُصفّر السرعة تلقائيًا |
| مفاتيح الأسهم | key down ثم step ثم key up | override مؤقت للسرعة، مع عودة السرعة السابقة بعد رفع المفتاح |
| Create event | تسجيل event main_type=0 ثم إنشاء instance | event ينفذ مرة واحدة فقط |
| Step ordering | تسجيل Begin/Step/End | ترتيب التنفيذ ثابت في كل إطار |
| Alarm | ضبط alarm ثم step بعدد كافٍ | callback ينفذ عند الصفر مرة واحدة |
| Collision | instance متداخلان مع object IDs متوافقة | collision count موجب وcallback مناسب |
| Room transition | `nativeRuntimeSetRoom` مع clearInstances=true | room_id يتغير، instances العابرة تنظف |
| Resource cleanup | `nativeRuntimeDestroy` ثم create جديد | لا بقاء للـ bitmaps/DS/scripts/events/code points |
| GML capacity | 300 متغير و10 معاملات | يطابق `vm_smoke_test` النتيجة 300 |

## معايير القبول

لا يُعلن اكتمال runtime إلا إذا نجحت الحالات السابقة على arm64-v8a وعلى build Release، ولم تظهر أخطاء JNI أو crash أو تسرب يمكن رصده في دورة destroy/create المتكررة.

## ملاحظة الأداء

يجب فصل correctness عن performance. بعد نجاح الاختبارات الوظيفية، يُقاس متوسط زمن 10,000 خطوة في harness أو على جهاز Android، وتُسجل النتيجة مع ABI والجهاز وإعدادات البناء. لا تُستخدم أرقام مُحاكاة.
