const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

//middlew
app.use(cors());
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@butterfly44.cfqpplt.mongodb.net/?appName=butterfly44`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});



app.get('/', (req, res) => {
    res.send('Krishi server is running')
})

async function run() {
    try {
        // await client.connect();


        const db = client.db('krishi_db');
        const productsCollection = db.collection('products');
        const interestsCollection = db.collection('interest');
        const usersCollection = db.collection('users');


        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const email = req.body.email;
            const query = { email: email }
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                res.send({ message: 'user already exist' })
            }
            else {
                const result = await usersCollection.insertOne(newUser);
                res.send(result);
            }

        })

        app.get('/products', async (req, res) => {

            console.log(req.query)
            const email = req.query.email;
            const query = {}
            if (email) {
                query.owner_email = email;
            }

            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/latest-crops', async (req, res) => {
            const cursor = productsCollection.find().sort({ created_at: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })


        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            // const query = { _id: id};
            const result = await productsCollection.findOne(query);
            res.status(200).json({
                status: 200,
                message: "Single product",
                data: result,
            });
        });


        app.post('/products', async (req, res) => {
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct);
            res.send(result);
        })

        app.patch('/products/:id', async (req, res) => {
            const id = req.params.id;
            const updateProduct = req.body;
            const query = { _id: new ObjectId(id) }
            const update = {
                $set: {
                    name: updateProduct.name,
                    price: updateProduct.price
                }
            }
            const result = await productsCollection.updateOne(query, update)
            res.send(result);
        })

        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })



        //interest api
        app.get('/interest', async (req, res) => {
            const email = req.query.email;
            const query = {};
            if (email) {
                query.userEmail = email;
            }
            const cursor = interestsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })



        app.get('/interest/crop/:cropId', async (req, res) => {
            const cropId = req.params.cropId;
            const query = { cropId: cropId };
            const cursor = interestsCollection.find(query).sort({price: -1});
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/interest', async (req, res) => {

            const query = {};
            if (query.email) {
                query.userEmail = email;
            }
            const cursor = interestsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/interest/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await interestsCollection.findOne(query);
            res.send(result);
        })

        app.post('/interest', async (req, res) => {
            const newinterest = req.body;
            const result = await interestsCollection.insertOne(newinterest);
            res.send(result);
        })

        app.delete('/interest/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await interestsCollection.deleteOne(query);
            res.send(result);
        })


        app.patch('/interest/:id', async (req, res) => {
            const id = req.params.id;
            const { status } = req.body;

            if (!["accepted", "rejected", "pending"].includes(status)) {
                return res.status(400).json({ message: "Invalid status value" });
            }

            try {
                const query = { _id: new ObjectId(id) };
                const update = { $set: { status } };
                const result = await interestsCollection.findOneAndUpdate(query, update, { returnDocument: "after" });

                if (!result.value) {
                    return res.status(404).json({ message: "Interest not found" });
                }

                res.status(200).json({
                    message: `Interest ${status}`,
                    status: result.value.status,
                    interest: result.value
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: "Server error", error: err.message });
            }
        });


        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Krishi server is running on port: ${port}`)
})

