type BusinessAlert = {
  type: "warning" | "danger" | "success";
  title: string;
  message: string;
};

type BusinessAlertsProps = {
  businessAlerts: BusinessAlert[];
};

export default function BusinessAlerts({
  businessAlerts,
}: BusinessAlertsProps) {
  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-5">
          <div className="text-sm font-medium text-slate-500">
            Business Alerts
          </div>

          <div className="mt-1 text-lg font-semibold text-slate-950">
            Things that need your attention
          </div>
        </div>


        <div className="space-y-3">

          {businessAlerts.length === 0 ? (

            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
              No important business alerts right now.
            </div>

          ) : (

            businessAlerts.map((alert, index) => (

              <div
                key={`${alert.title}-${index}`}
                className={`rounded-xl border p-4 ${
                  alert.type === "danger"
                    ? "border-red-200 bg-red-50"
                    : alert.type === "warning"
                      ? "border-amber-200 bg-amber-50"
                      : "border-emerald-200 bg-emerald-50"
                }`}
              >

                <div
                  className={`font-semibold ${
                    alert.type === "danger"
                      ? "text-red-800"
                      : alert.type === "warning"
                        ? "text-amber-800"
                        : "text-emerald-800"
                  }`}
                >
                  {alert.title}
                </div>


                <div
                  className={`mt-1 text-sm ${
                    alert.type === "danger"
                      ? "text-red-700"
                      : alert.type === "warning"
                        ? "text-amber-700"
                        : "text-emerald-700"
                  }`}
                >
                  {alert.message}
                </div>

              </div>

            ))

          )}

        </div>

      </div>
    </section>
  );
}