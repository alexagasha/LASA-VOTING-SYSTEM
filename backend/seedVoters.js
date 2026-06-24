require("dotenv").config();
const supabase = require("./db/supabase");

const voters = require("./voters"); // your voters.js file

async function seed() {
    console.log("Seeding voters...");

    let added = 0;
    let failed = 0;

    for (const v of voters) {
        const { error } = await supabase
            .from("voters")
            .upsert(
                [
                    {
                        voter_id: v.id,
                        name: v.name,
                        email: v.email.trim().toLowerCase(),
                        pin: String(v.pin),
                        voted: 0,
                        role: v.role
                    }
                ],
                { onConflict: "voter_id" }   // <-- update on matching voter_id instead of erroring
            );

        if (error) {
            console.log("Error:", v.email, "-", error.message);
            failed++;
        } else {
            added++;
        }
    }

    console.log(`\nSeeding complete! ${added} upserted, ${failed} failed.`);
}

seed();