export default function CashierLeaderboard({

    cashiers = []

}) {

    return (

        <div
            className="
            bg-white
            rounded-3xl
            shadow
            p-8
            "
        >

            <h2
                className="
                font-bold
                text-xl
                mb-6
                "
            >
                Top Cashiers
            </h2>

            {

                cashiers.length === 0 ? (

                    <div
                        className="
                        h-64
                        flex
                        items-center
                        justify-center
                        text-slate-400
                        "
                    >
                        No cashier data available.
                    </div>

                ) : (

                    <div className="space-y-4">

                        {

                            cashiers
                                .slice(0, 5)
                                .map((cashier, index) => (

                                    <div

                                        key={cashier.id || index}

                                        className="
                                        flex
                                        justify-between
                                        items-center
                                        bg-slate-50
                                        p-4
                                        rounded-2xl
                                        "

                                    >

                                        <div>

                                            <p className="font-semibold">

                                                {cashier.name}

                                            </p>

                                            <p className="text-sm text-slate-500">

                                                {cashier.transactionCount} transactions

                                            </p>

                                        </div>

                                        <p className="font-bold">

                                            UGX {Number(cashier.totalSales || 0).toLocaleString()}

                                        </p>

                                    </div>

                                ))

                        }

                    </div>

                )

            }

        </div>

    );

}