from sqlalchemy.orm import Session
import models

ARTICLES = [
    dict(
        title="The Last Letterpress in Nairobi",
        author="Amara Otieno",
        category="Culture",
        read_time="6 min",
        featured=True,
        img_url="https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=900&q=80",
        excerpt="Inside the workshop keeping a century-old printing craft alive, one plate at a time.",
        body="Down a side street off Kimathi Avenue, a printing press older than the country itself still hums to life each morning. Ink-stained hands set type letter by letter, the way it has been done since 1938.\n\nThe owner, now in his seventies, learned the trade from his father. He worries the craft will end with him, but he keeps the machines running anyway, one wedding invitation at a time.\n\nDigital printing has taken most of the business, but a small, loyal clientele still prefers the texture only a letterpress can leave behind: the faint impression of the letters pressed into thick cotton paper.",
    ),
    dict(
        title="Why Batteries Are Getting Boring (In a Good Way)",
        author="Jide Coker",
        category="Technology",
        read_time="5 min",
        featured=False,
        img_url="https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=700&q=80",
        excerpt="The most important battery innovations of the decade aren't flashy. That's the point.",
        body="For years, battery headlines promised breakthroughs that never shipped. The real progress has been quieter: incremental gains in manufacturing that make batteries cheaper, safer, and more predictable.\n\nBoring, in this case, is a feature. Predictable chemistry means fewer recalls and longer warranties, and it's why electric vehicles are finally becoming an appliance rather than an experiment.",
    ),
    dict(
        title="The Fungus That Talks in Electrical Pulses",
        author="Dr. Wanjiru Kamau",
        category="Science",
        read_time="7 min",
        featured=False,
        img_url="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=700&q=80",
        excerpt="New research suggests mycelial networks may pass information the way neurons do.",
        body="Researchers placed electrodes into fungal mycelium and recorded rhythmic spikes of electrical activity, some clustering into patterns reminiscent of a simple vocabulary.\n\nNobody is claiming fungi are conscious. But the findings add to a growing body of work suggesting that information can travel through biological networks far simpler than a brain.",
    ),
    dict(
        title="Salt Route",
        author="Teresa Mbeki",
        category="Fiction",
        read_time="9 min",
        featured=False,
        img_url="https://images.unsplash.com/photo-1500534623283-312aade485b7?w=700&q=80",
        excerpt="A short story about a caravan driver who has memorized every dune between here and the coast.",
        body="Musa had driven the salt route for eleven years, long enough to know the dunes by name, though he'd never told anyone that. The one shaped like a sleeping camel. The one that swallowed his cousin's truck in '09.\n\nTonight the wind was wrong. It came from the east instead of the north, and the sand it carried had a different weight to it, the kind that meant the route would look different by morning.",
    ),
    dict(
        title="The Quiet Rise of the Four-Day Warehouse",
        author="Peter Achieng",
        category="Business",
        read_time="4 min",
        featured=False,
        img_url="https://images.unsplash.com/photo-1553413077-190dd305871c?w=700&q=80",
        excerpt="Logistics firms are running the numbers on shorter weeks, and the math is surprising.",
        body="A handful of logistics companies have quietly moved to four-day operating weeks for warehouse staff, expecting a drop in output. Instead, several reported throughput holding steady.\n\nThe explanation seems to be fewer errors and less equipment downtime, since fatigue-related mistakes were eating into the fifth day's gains anyway.",
    ),
    dict(
        title="Matatu Art as Moving Gallery",
        author="Brian Otieno",
        category="Culture",
        read_time="5 min",
        featured=False,
        img_url="https://images.unsplash.com/photo-1509909756405-be0199881695?w=700&q=80",
        excerpt="How Nairobi's decorated minibuses became one of East Africa's most visible art scenes.",
        body="Every matatu that rolls through Nairobi's streets is a canvas, repainted every season with murals ranging from pop stars to abstract geometry.\n\nFor the young artists who compete for commissions, a well-loved matatu design can travel further and be seen by more people in a week than a gallery show would manage in a year.",
    ),
    dict(
        title="The Keyboard That Refuses to Die",
        author="Sam Otieno",
        category="Technology",
        read_time="6 min",
        featured=False,
        img_url="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80",
        excerpt="Mechanical keyboards were supposed to be a niche hobby. They became a $2 billion industry.",
        body="What began as forum threads trading vintage switches has become a full industry, with group-buys that raise millions and waiting lists that stretch past a year.\n\nThe appeal, collectors say, has less to do with typing speed and more with the tactile ritual of building something by hand in an increasingly disposable world.",
    ),
    dict(
        title="Mapping the Sound of a Coral Reef",
        author="Grace Njoroge",
        category="Science",
        read_time="5 min",
        featured=False,
        img_url="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=700&q=80",
        excerpt="Marine biologists are using underwater microphones to check on reef health from a distance.",
        body="A healthy reef, it turns out, is a noisy place: snapping shrimp, grunting fish, and the low crackle of activity that recedes almost entirely on a dying reef.\n\nResearchers now drop hydrophones onto reefs for weeks at a time, using the resulting soundscape to flag damage long before a diver would spot it visually.",
    ),
]


def seed_data(db: Session):
    if db.query(models.Article).count() > 0:
        return
    for a in ARTICLES:
        db.add(models.Article(**a))
    db.commit()
