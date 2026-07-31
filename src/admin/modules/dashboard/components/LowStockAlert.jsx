export default function LowStockAlert({

    products = []

}) {

    if (products.length === 0) {

        return null;

    }

    return (

        <div
            className="
            bg-orange-50
            border
            border-orange-200
            rounded-3xl
            p-8
            "
        >

            <h2
                className="
                font-bold
                text-xl
                text-orange-700
                mb-5
                "
            >
                Low Stock Alerts
            </h2>

            <div
                className="
                grid
                md:grid-cols-4
                gap-4
                "
            >

                {

                    products.map(product => (

                        <div

                            key={product.id}

                            className="
                            bg-white
                            p-5
                            rounded-2xl
                            "

                        >

                            <p className="font-semibold">

                                {product.name}

                            </p>

                            <p
                                className="
                                text-3xl
                                font-bold
                                text-red-600
                                "
                            >

                                {product.stockQuantity}

                            </p>

                            <p className="text-sm text-slate-500">

                                remaining

                            </p>

                        </div>

                    ))

                }

            </div>

        </div>

    );

}