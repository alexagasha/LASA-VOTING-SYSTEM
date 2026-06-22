require("dotenv").config();
const supabase = require("./db/supabase");

const voters = require("./voters"); // your file

async function seed() {
    console.log("Seeding voters...");

    for (const v of voters) {
        const { error } = await supabase.from("voters").upsert([
            {
                voter_id: v.id,
                name: v.name,
                email: v.email.trim().toLowerCase(),
                pin: v.pin,
                voted: v.voted,
                role: v.role
            }
        ]);

        if (error) {
            console.log("Error inserting:", v.email, error.message);
        }
    }

    console.log("Seeding complete!");
}

seed();