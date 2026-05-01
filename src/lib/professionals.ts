const API_BASE = '/api/python/professionals';

// ─── Types ──────────────────────────────────────────────────

export type ProfessionType =
    | 'interior_designer'
    | 'contractor'
    | 'carpenter'
    | 'painter'
    | 'architect'
    | 'electrician'
    | 'plumber';

export interface Professional {
    id: string;
    name: string;
    profession: ProfessionType;
    city: string;
    state: string;
    phone: string;
    email: string | null;
    visiting_charge_inr: number;
    rate_per_sqft_inr: number;
    experience_years: number;
    bio: string;
    portfolio_images: string[];
    image?: string; // Profile image
    rating: number;
    review_count: number;
    verified: boolean;
    created_at: string;
}

export interface ProfessionalReview {
    id: string;
    professional_id: string;
    reviewer_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export interface RegisterProfessionalData {
    name: string;
    profession: ProfessionType;
    city: string;
    state: string;
    phone: string;
    email?: string;
    visiting_charge_inr: number;
    rate_per_sqft_inr: number;
    experience_years: number;
    bio?: string;
}

// ─── Profession Labels ──────────────────────────────────────

export const PROFESSION_LABELS: Record<ProfessionType, string> = {
    interior_designer: 'Interior Designer',
    contractor: 'Contractor',
    carpenter: 'Carpenter',
    painter: 'Painter',
    architect: 'Architect',
    electrician: 'Electrician',
    plumber: 'Plumber',
};

// ─── Indian States ──────────────────────────────────────────

export const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Chandigarh', 'Puducherry',
];

// ─── Fallback Data (Local Feed) ──────────────────────────

export const fallbackProfessionals: Professional[] = [
    // Architects
    { id: "pro_a1", name: "Aarav Sharma", profession: "architect", city: "Mumbai", state: "Maharashtra", phone: "+91 98765 43210", email: "aarav.s@designstudio.com", visiting_charge_inr: 2000, rate_per_sqft_inr: 150, experience_years: 12, bio: "Specializing in modern sustainable architecture and green building design.", portfolio_images: [], image: "/images/generated/professional_architect_working.png", rating: 4.8, review_count: 45, verified: true, created_at: "2023-01-15T10:00:00Z" },
    { id: "pro_a2", name: "Vikram Singh", profession: "architect", city: "Jaipur", state: "Rajasthan", phone: "+91 94140 12345", email: "vikram.s@royalarch.com", visiting_charge_inr: 2500, rate_per_sqft_inr: 180, experience_years: 15, bio: "Preserving heritage through modern techniques. Expert in luxury villas.", portfolio_images: [], image: "/images/generated/professional_architect_working.png", rating: 4.9, review_count: 56, verified: true, created_at: "2023-02-20T11:30:00Z" },
    { id: "pro_a3", name: "Priya Desai", profession: "architect", city: "Ahmedabad", state: "Gujarat", phone: "+91 98222 33445", email: "priya@desaiarch.in", visiting_charge_inr: 1800, rate_per_sqft_inr: 140, experience_years: 9, bio: "Minimalist residential and commercial architecture.", portfolio_images: [], image: "/images/generated/professional_architect_working.png", rating: 4.7, review_count: 38, verified: true, created_at: "2023-03-10T09:15:00Z" },
    { id: "pro_a4", name: "Arjun Nair", profession: "architect", city: "Kochi", state: "Kerala", phone: "+91 99988 77766", email: "arjun.n@tropicaldesigns.com", visiting_charge_inr: 1500, rate_per_sqft_inr: 120, experience_years: 11, bio: "Tropical architecture maximizing natural ventilation and light.", portfolio_images: [], image: "/images/generated/professional_architect_working.png", rating: 4.6, review_count: 22, verified: false, created_at: "2023-04-05T14:45:00Z" },
    { id: "pro_a5", name: "Neha Gupta", profession: "architect", city: "Delhi", state: "Delhi", phone: "+91 98111 22233", email: "neha.g@urbanform.in", visiting_charge_inr: 3000, rate_per_sqft_inr: 200, experience_years: 18, bio: "Award-winning urban planner and commercial architect.", portfolio_images: [], image: "/images/generated/professional_architect_working.png", rating: 5.0, review_count: 89, verified: true, created_at: "2022-11-12T08:20:00Z" },
    { id: "pro_a6", name: "Siddharth Bose", profession: "architect", city: "Kolkata", state: "West Bengal", phone: "+91 97444 55566", email: "sid.bose@boseassociates.com", visiting_charge_inr: 1200, rate_per_sqft_inr: 100, experience_years: 7, bio: "Contemporary redesign of traditional Bengali homes.", portfolio_images: [], image: "/images/generated/professional_architect_working.png", rating: 4.5, review_count: 15, verified: true, created_at: "2023-06-25T16:10:00Z" },
    { id: "pro_a7", name: "Rahul Khanna", profession: "architect", city: "Bangalore", state: "Karnataka", phone: "+91 98111 77889", email: "rahul.k@architects.in", visiting_charge_inr: 2200, rate_per_sqft_inr: 160, experience_years: 10, bio: "Modern apartment complexes and commercial spaces.", portfolio_images: [], image: "/images/generated/professional_architect_working.png", rating: 4.7, review_count: 25, verified: true, created_at: "2023-08-15T10:00:00Z" },

    // Interior Designers
    { id: "pro_id1", name: "Ishani Gupta", profession: "interior_designer", city: "Delhi", state: "Delhi", phone: "+91 98234 56789", email: "ishani.g@interiors.in", visiting_charge_inr: 1500, rate_per_sqft_inr: 200, experience_years: 8, bio: "Luxury residential interiors with contemporary Indian aesthetics.", portfolio_images: [], image: "/images/generated/interior_designer_consultation.png", rating: 4.9, review_count: 32, verified: true, created_at: "2023-01-10T09:00:00Z" },
    { id: "pro_id2", name: "Meera Patel", profession: "interior_designer", city: "Ahmedabad", state: "Gujarat", phone: "+91 99887 76655", email: "meera.patel@designhub.com", visiting_charge_inr: 1200, rate_per_sqft_inr: 120, experience_years: 6, bio: "Passionate about minimalist and functional designs.", portfolio_images: [], image: "/images/generated/interior_designer_consultation.png", rating: 4.6, review_count: 15, verified: false, created_at: "2023-02-14T10:30:00Z" },
    { id: "pro_id3", name: "Ananya Reddy", profession: "interior_designer", city: "Hyderabad", state: "Telangana", phone: "+91 95000 11223", email: "ananya.r@greeneries.com", visiting_charge_inr: 1800, rate_per_sqft_inr: 80, experience_years: 7, bio: "Biophilic design creating lush indoor environments.", portfolio_images: [], image: "/images/generated/interior_designer_consultation.png", rating: 4.5, review_count: 12, verified: true, created_at: "2023-03-22T14:00:00Z" },
    { id: "pro_id4", name: "Zara Khan", profession: "interior_designer", city: "Pune", state: "Maharashtra", phone: "+91 97300 44556", email: "zara.k@modernliving.com", visiting_charge_inr: 1000, rate_per_sqft_inr: 150, experience_years: 4, bio: "Affordable yet chic home makeovers for young professionals.", portfolio_images: [], image: "/images/generated/interior_designer_consultation.png", rating: 4.4, review_count: 8, verified: false, created_at: "2023-05-01T11:15:00Z" },
    { id: "pro_id5", name: "Ravi Varma", profession: "interior_designer", city: "Bangalore", state: "Karnataka", phone: "+91 98877 66554", email: "ravi.v@varmadesign.com", visiting_charge_inr: 2500, rate_per_sqft_inr: 250, experience_years: 14, bio: "High-end corporate and hospitality interior design.", portfolio_images: [], image: "/images/generated/interior_designer_consultation.png", rating: 4.8, review_count: 67, verified: true, created_at: "2022-10-05T09:45:00Z" },
    { id: "pro_id6", name: "Kriti Sanon", profession: "interior_designer", city: "Mumbai", state: "Maharashtra", phone: "+91 99111 33344", email: "kriti@spacesbykriti.in", visiting_charge_inr: 2000, rate_per_sqft_inr: 180, experience_years: 9, bio: "Bohemian and eclectic apartment styling.", portfolio_images: [], image: "/images/generated/interior_designer_consultation.png", rating: 4.7, review_count: 41, verified: true, created_at: "2023-04-18T15:20:00Z" },
    { id: "pro_id7", name: "Sanya Malhotra", profession: "interior_designer", city: "Delhi", state: "Delhi", phone: "+91 98111 55667", email: "sanya.m@interiordesign.in", visiting_charge_inr: 1600, rate_per_sqft_inr: 190, experience_years: 5, bio: "Minimalist and sustainable home interiors.", portfolio_images: [], image: "/images/generated/interior_designer_consultation.png", rating: 4.5, review_count: 18, verified: true, created_at: "2023-09-01T10:00:00Z" },

    // Electricians
    { id: "pro_e1", name: "Rohan Mehra", profession: "electrician", city: "Bangalore", state: "Karnataka", phone: "+91 97654 32109", email: "rohan.light@glow.com", visiting_charge_inr: 1000, rate_per_sqft_inr: 50, experience_years: 10, bio: "Expert in architectural lighting and smart home integration.", portfolio_images: [], image: "/images/generated/certified_electrician_working.png", rating: 4.7, review_count: 28, verified: true, created_at: "2023-01-20T08:00:00Z" },
    { id: "pro_e2", name: "Amit Kumar", profession: "electrician", city: "Delhi", state: "Delhi", phone: "+91 98123 98765", email: "amit.elec@fastfix.in", visiting_charge_inr: 500, rate_per_sqft_inr: 30, experience_years: 15, bio: "Reliable residential electrical repairs and rewiring.", portfolio_images: [], image: "/images/generated/certified_electrician_working.png", rating: 4.5, review_count: 120, verified: true, created_at: "2022-09-10T10:00:00Z" },
    { id: "pro_e3", name: "Suresh Pillai", profession: "electrician", city: "Chennai", state: "Tamil Nadu", phone: "+91 99444 33221", email: null, visiting_charge_inr: 600, rate_per_sqft_inr: 40, experience_years: 22, bio: "Commercial electrical setups and heavy machinery wiring.", portfolio_images: [], image: "/images/generated/certified_electrician_working.png", rating: 4.9, review_count: 85, verified: true, created_at: "2022-08-15T12:30:00Z" },
    { id: "pro_e4", name: "Manoj Das", profession: "electrician", city: "Kolkata", state: "West Bengal", phone: "+91 98333 44555", email: null, visiting_charge_inr: 400, rate_per_sqft_inr: 25, experience_years: 8, bio: "Quick fixes and appliance installations.", portfolio_images: [], image: "/images/generated/certified_electrician_working.png", rating: 4.3, review_count: 34, verified: false, created_at: "2023-07-02T09:00:00Z" },
    { id: "pro_e5", name: "Vivek Sharma", profession: "electrician", city: "Mumbai", state: "Maharashtra", phone: "+91 99222 11000", email: "vivek.smart@homes.in", visiting_charge_inr: 1500, rate_per_sqft_inr: 80, experience_years: 12, bio: "Home automation specialist. Control4 and Crestron certified.", portfolio_images: [], image: "/images/generated/certified_electrician_working.png", rating: 4.8, review_count: 52, verified: true, created_at: "2023-02-28T14:15:00Z" },
    { id: "pro_e6", name: "Tariq Ali", profession: "electrician", city: "Lucknow", state: "Uttar Pradesh", phone: "+91 94555 66777", email: null, visiting_charge_inr: 300, rate_per_sqft_inr: 20, experience_years: 18, bio: "Experienced in older building rewiring and safety upgrades.", portfolio_images: [], image: "/images/generated/certified_electrician_working.png", rating: 4.6, review_count: 76, verified: true, created_at: "2022-12-10T16:45:00Z" },
    { id: "pro_e7", name: "Sanjay Gupta", profession: "electrician", city: "Ahmedabad", state: "Gujarat", phone: "+91 98111 22334", email: null, visiting_charge_inr: 450, rate_per_sqft_inr: 35, experience_years: 12, bio: "Residential wiring and fuse box upgrades.", portfolio_images: [], image: "/images/generated/certified_electrician_working.png", rating: 4.4, review_count: 45, verified: true, created_at: "2023-10-05T12:00:00Z" },

    // Carpenters
    { id: "pro_c1", name: "Kabir Malhotra", profession: "carpenter", city: "Chandigarh", state: "Punjab", phone: "+91 98123 45670", email: "kabir@bespokewood.com", visiting_charge_inr: 3000, rate_per_sqft_inr: 0, experience_years: 20, bio: "Master craftsman for teak furniture and bespoke woodwork.", portfolio_images: [], image: "/images/generated/master_carpenter_workshop.png", rating: 5.0, review_count: 89, verified: true, created_at: "2022-05-15T09:00:00Z" },
    { id: "pro_c2", name: "Ram Singh", profession: "carpenter", city: "Jaipur", state: "Rajasthan", phone: "+91 94111 22334", email: null, visiting_charge_inr: 800, rate_per_sqft_inr: 400, experience_years: 25, bio: "Traditional Rajasthani carving and intricate wooden doors.", portfolio_images: [], image: "/images/generated/master_carpenter_workshop.png", rating: 4.9, review_count: 112, verified: true, created_at: "2022-06-20T11:30:00Z" },
    { id: "pro_c3", name: "Nitin Patil", profession: "carpenter", city: "Pune", state: "Maharashtra", phone: "+91 98999 88776", email: "nitin.woodworks@gmail.com", visiting_charge_inr: 500, rate_per_sqft_inr: 250, experience_years: 10, bio: "Modular kitchen installation and custom wardrobes.", portfolio_images: [], image: "/images/generated/master_carpenter_workshop.png", rating: 4.5, review_count: 45, verified: true, created_at: "2023-04-12T10:15:00Z" },
    { id: "pro_c4", name: "Gurpreet Singh", profession: "carpenter", city: "Ludhiana", state: "Punjab", phone: "+91 97888 55443", email: null, visiting_charge_inr: 600, rate_per_sqft_inr: 300, experience_years: 15, bio: "Heavy furniture framing and structural woodwork.", portfolio_images: [], image: "/images/generated/master_carpenter_workshop.png", rating: 4.6, review_count: 67, verified: false, created_at: "2023-01-05T14:00:00Z" },
    { id: "pro_c5", name: "Bala Murugan", profession: "carpenter", city: "Chennai", state: "Tamil Nadu", phone: "+91 99444 11223", email: null, visiting_charge_inr: 700, rate_per_sqft_inr: 350, experience_years: 18, bio: "Rosewood specialist and antique furniture restoration.", portfolio_images: [], image: "/images/generated/master_carpenter_workshop.png", rating: 4.8, review_count: 54, verified: true, created_at: "2022-11-22T09:30:00Z" },
    { id: "pro_c6", name: "Ashok Verma", profession: "carpenter", city: "Delhi", state: "Delhi", phone: "+91 98111 55667", email: "ashok.v@delhicarpentry.in", visiting_charge_inr: 500, rate_per_sqft_inr: 200, experience_years: 12, bio: "Quick home repairs, door hanging, and lock installations.", portfolio_images: [], image: "/images/generated/master_carpenter_workshop.png", rating: 4.4, review_count: 130, verified: true, created_at: "2022-08-30T16:00:00Z" },
    { id: "pro_c7", name: "Vikram Malhotra", profession: "carpenter", city: "Mumbai", state: "Maharashtra", phone: "+91 98222 11223", email: null, visiting_charge_inr: 1200, rate_per_sqft_inr: 500, experience_years: 14, bio: "Bespoke wooden furniture and office fit-outs.", portfolio_images: [], image: "/images/generated/master_carpenter_workshop.png", rating: 4.7, review_count: 38, verified: true, created_at: "2023-11-10T14:00:00Z" },

    // Painters
    { id: "pro_p1", name: "Anil Kumar", profession: "painter", city: "Mumbai", state: "Maharashtra", phone: "+91 98222 44556", email: null, visiting_charge_inr: 500, rate_per_sqft_inr: 25, experience_years: 15, bio: "Interior and exterior painting, waterproofing expert.", portfolio_images: [], image: "/images/generated/professional_painter_action.png", rating: 4.6, review_count: 88, verified: true, created_at: "2023-02-10T09:00:00Z" },
    { id: "pro_p2", name: "Rajesh Painter", profession: "painter", city: "Delhi", state: "Delhi", phone: "+91 98111 66778", email: null, visiting_charge_inr: 400, rate_per_sqft_inr: 20, experience_years: 12, bio: "Texture painting, stencils, and custom wall murals.", portfolio_images: [], image: "/images/generated/professional_painter_action.png", rating: 4.8, review_count: 65, verified: true, created_at: "2023-03-15T11:30:00Z" },
    { id: "pro_p3", name: "Sunil Yadav", profession: "painter", city: "Bangalore", state: "Karnataka", phone: "+91 99888 22334", email: "sunil.colors@gmail.com", visiting_charge_inr: 600, rate_per_sqft_inr: 30, experience_years: 10, bio: "Eco-friendly, low-VOC painting solutions for homes.", portfolio_images: [], image: "/images/generated/professional_painter_action.png", rating: 4.7, review_count: 42, verified: true, created_at: "2023-05-20T10:15:00Z" },
    { id: "pro_p4", name: "Mohammed Zaid", profession: "painter", city: "Hyderabad", state: "Telangana", phone: "+91 97555 11223", email: null, visiting_charge_inr: 300, rate_per_sqft_inr: 18, experience_years: 8, bio: "Fast and affordable apartment repainting.", portfolio_images: [], image: "/images/generated/professional_painter_action.png", rating: 4.3, review_count: 55, verified: false, created_at: "2023-06-05T14:00:00Z" },
    { id: "pro_p5", name: "Kishore Das", profession: "painter", city: "Kolkata", state: "West Bengal", phone: "+91 98333 77889", email: null, visiting_charge_inr: 400, rate_per_sqft_inr: 22, experience_years: 20, bio: "Heritage building restoration and lime wash painting.", portfolio_images: [], image: "/images/generated/professional_painter_action.png", rating: 4.9, review_count: 70, verified: true, created_at: "2022-12-12T09:30:00Z" },
    { id: "pro_p6", name: "Dinesh Sharma", profession: "painter", city: "Pune", state: "Maharashtra", phone: "+91 98999 44556", email: "dinesh.paints@pune.in", visiting_charge_inr: 500, rate_per_sqft_inr: 28, experience_years: 14, bio: "Premium wood polishing, PU coating, and enamel work.", portfolio_images: [], image: "/images/generated/professional_painter_action.png", rating: 4.7, review_count: 90, verified: true, created_at: "2022-10-25T16:00:00Z" },
    { id: "pro_p7", name: "Akash Verma", profession: "painter", city: "Ahmedabad", state: "Gujarat", phone: "+91 98111 33445", email: null, visiting_charge_inr: 450, rate_per_sqft_inr: 24, experience_years: 9, bio: "Interior decorative painting and wall art.", portfolio_images: [], image: "/images/generated/professional_painter_action.png", rating: 4.6, review_count: 32, verified: true, created_at: "2023-12-05T10:00:00Z" },

    // Contractors
    { id: "pro_con1", name: "L&T Home Solutions", profession: "contractor", city: "Mumbai", state: "Maharashtra", phone: "+91 98222 11223", email: "contact@lths.com", visiting_charge_inr: 5000, rate_per_sqft_inr: 2500, experience_years: 25, bio: "End-to-end turnkey residential and commercial contracting.", portfolio_images: [], image: "/images/generated/general_contractor_site.png", rating: 4.9, review_count: 210, verified: true, created_at: "2022-01-10T09:00:00Z" },
    { id: "pro_con2", name: "BuildRight Infra", profession: "contractor", city: "Delhi", state: "Delhi", phone: "+91 98111 33445", email: "info@buildright.in", visiting_charge_inr: 3000, rate_per_sqft_inr: 2000, experience_years: 18, bio: "Civil works, remodeling, and structural extensions.", portfolio_images: [], image: "/images/generated/general_contractor_site.png", rating: 4.7, review_count: 145, verified: true, created_at: "2022-03-15T11:30:00Z" },
    { id: "pro_con3", name: "Namma Contractors", profession: "contractor", city: "Bangalore", state: "Karnataka", phone: "+91 99888 55667", email: "projects@namma.com", visiting_charge_inr: 2500, rate_per_sqft_inr: 1800, experience_years: 12, bio: "Specialists in independent villas and duplex construction.", portfolio_images: [], image: "/images/generated/general_contractor_site.png", rating: 4.8, review_count: 95, verified: true, created_at: "2022-05-20T10:15:00Z" },
    { id: "pro_con4", name: "Shree Builders", profession: "contractor", city: "Ahmedabad", state: "Gujarat", phone: "+91 97555 77889", email: "hello@shreebuild.in", visiting_charge_inr: 2000, rate_per_sqft_inr: 1500, experience_years: 30, bio: "Trusted local builders for residential complexes and bungalows.", portfolio_images: [], image: "/images/generated/general_contractor_site.png", rating: 4.6, review_count: 180, verified: true, created_at: "2022-07-05T14:00:00Z" },
    { id: "pro_con5", name: "Deccan Constructs", profession: "contractor", city: "Hyderabad", state: "Telangana", phone: "+91 95000 33445", email: "sales@deccancon.com", visiting_charge_inr: 3500, rate_per_sqft_inr: 2200, experience_years: 15, bio: "Premium construction with a focus on Vastu compliance.", portfolio_images: [], image: "/images/generated/general_contractor_site.png", rating: 4.5, review_count: 60, verified: false, created_at: "2023-01-12T09:30:00Z" },
    { id: "pro_con6", name: "Pioneer Renovation", profession: "contractor", city: "Pune", state: "Maharashtra", phone: "+91 98999 11223", email: "info@pioneerrenovate.com", visiting_charge_inr: 1500, rate_per_sqft_inr: 1200, experience_years: 10, bio: "Fast and reliable bathroom and kitchen remodeling.", portfolio_images: [], image: "/images/generated/general_contractor_site.png", rating: 4.4, review_count: 75, verified: true, created_at: "2023-04-25T16:00:00Z" },
    { id: "pro_con7", name: "Global Infra", profession: "contractor", city: "Chennai", state: "Tamil Nadu", phone: "+91 99444 22334", email: "contact@globalinfra.com", visiting_charge_inr: 4000, rate_per_sqft_inr: 2400, experience_years: 22, bio: "International quality standards for residential projects.", portfolio_images: [], image: "/images/generated/general_contractor_site.png", rating: 4.8, review_count: 120, verified: true, created_at: "2023-09-20T11:00:00Z" },

    // Plumbers
    { id: "pro_pl1", name: "Ramesh Plumber", profession: "plumber", city: "Delhi", state: "Delhi", phone: "+91 98111 77889", email: null, visiting_charge_inr: 400, rate_per_sqft_inr: 0, experience_years: 18, bio: "Expert in leakage detection, pipe fitting, and bathroom fixtures.", portfolio_images: [], image: "/images/generated/professional_plumber_service.png", rating: 4.7, review_count: 150, verified: true, created_at: "2022-08-10T09:00:00Z" },
    { id: "pro_pl2", name: "Kannan M", profession: "plumber", city: "Chennai", state: "Tamil Nadu", phone: "+91 99444 55667", email: null, visiting_charge_inr: 300, rate_per_sqft_inr: 0, experience_years: 25, bio: "Commercial plumbing systems and motor installations.", portfolio_images: [], image: "/images/generated/professional_plumber_service.png", rating: 4.9, review_count: 200, verified: true, created_at: "2022-02-15T11:30:00Z" },
    { id: "pro_pl3", name: "Ganesh Fittings", profession: "plumber", city: "Mumbai", state: "Maharashtra", phone: "+91 98222 77889", email: "ganesh@plumbmumbai.in", visiting_charge_inr: 500, rate_per_sqft_inr: 0, experience_years: 12, bio: "Premium bathroom fittings (Grohe, Jaguar) installation.", portfolio_images: [], image: "/images/generated/professional_plumber_service.png", rating: 4.8, review_count: 85, verified: true, created_at: "2022-11-20T10:15:00Z" },
    { id: "pro_pl4", name: "Abdul Qadir", profession: "plumber", city: "Lucknow", state: "Uttar Pradesh", phone: "+91 94555 11223", email: null, visiting_charge_inr: 250, rate_per_sqft_inr: 0, experience_years: 15, bio: "Quick response for blocked drains and tap repairs.", portfolio_images: [], image: "/images/generated/professional_plumber_service.png", rating: 4.5, review_count: 65, verified: false, created_at: "2023-03-05T14:00:00Z" },
    { id: "pro_pl5", name: "Vijay Plumbing", profession: "plumber", city: "Bangalore", state: "Karnataka", phone: "+91 99888 77889", email: "vijay.p@blrplumbing.com", visiting_charge_inr: 450, rate_per_sqft_inr: 0, experience_years: 10, bio: "Water heater installation and solar water heating setups.", portfolio_images: [], image: "/images/generated/professional_plumber_service.png", rating: 4.6, review_count: 90, verified: true, created_at: "2023-01-12T09:30:00Z" },
    { id: "pro_pl6", name: "Santosh Kumar", profession: "plumber", city: "Kolkata", state: "West Bengal", phone: "+91 98333 11223", email: null, visiting_charge_inr: 350, rate_per_sqft_inr: 0, experience_years: 20, bio: "Complete pipeline laying and over-head tank cleaning.", portfolio_images: [], image: "/images/generated/professional_plumber_service.png", rating: 4.4, review_count: 110, verified: true, created_at: "2022-05-25T16:00:00Z" },
    { id: "pro_pl7", name: "Mohan Lal", profession: "plumber", city: "Jaipur", state: "Rajasthan", phone: "+91 94140 33445", email: null, visiting_charge_inr: 300, rate_per_sqft_inr: 0, experience_years: 22, bio: "Residential plumbing and sanitary works.", portfolio_images: [], image: "/images/generated/professional_plumber_service.png", rating: 4.5, review_count: 55, verified: true, created_at: "2023-11-20T10:00:00Z" }
];

// ─── CRUD Functions ─────────────────────────────────────────

export async function registerProfessional(data: RegisterProfessionalData): Promise<Professional> {
    try {
        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...data,
                city: data.city.trim()
            }),
        });

        if (!res.ok) throw new Error('Registration failed');
        return res.json();
    } catch (err) {
        // For local-only mode, we could simulate a save, but for now we just throw
        console.error("Local mode: Registration requires backend.");
        throw err;
    }
}

export async function searchProfessionalsByCity(
    city: string,
    profession?: ProfessionType,
    sortBy: 'rating' | 'price_low' | 'price_high' | 'experience' = 'rating',
): Promise<Professional[]> {
    // Always start with local fallback data
    let localResults = fallbackProfessionals.filter(p => 
        p.city.toLowerCase().includes(city.toLowerCase()) || 
        city.toLowerCase().includes(p.city.toLowerCase())
    );
    
    if (profession) {
        localResults = localResults.filter(p => p.profession === profession);
    }

    // Try to fetch additional results from the API and merge
    try {
        const params = new URLSearchParams();
        params.append('city', city);
        if (profession) params.append('profession', profession);
        params.append('sort_by', sortBy);

        const res = await fetch(`${API_BASE}?${params.toString()}`);
        if (res.ok) {
            const apiResults: Professional[] = await res.json();
            if (Array.isArray(apiResults) && apiResults.length > 0) {
                // Merge: add API results that are not already in local data
                const localNames = new Set(localResults.map(p => p.name.toLowerCase()));
                const apiOnly = apiResults.filter(p => !localNames.has(p.name.toLowerCase()));
                localResults = [...localResults, ...apiOnly];
            }
        }
    } catch {
        // Backend unavailable — local data is already the base
    }

    // Sort combined results
    return localResults.sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'price_low') return a.visiting_charge_inr - b.visiting_charge_inr;
        if (sortBy === 'price_high') return b.visiting_charge_inr - a.visiting_charge_inr;
        if (sortBy === 'experience') return b.experience_years - a.experience_years;
        return 0;
    });
}

export async function getProfessionalById(id: string): Promise<Professional | null> {
    try {
        const res = await fetch(`${API_BASE}/${id}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return fallbackProfessionals.find(p => p.id === id) || null;
    }
}

export async function getAllCities(): Promise<string[]> {
    const localCities = Array.from(new Set(fallbackProfessionals.map(p => p.city)));
    try {
        const res = await fetch(`${API_BASE}/cities/list`);
        if (!res.ok) throw new Error();
        const apiCities: string[] = await res.json();
        if (Array.isArray(apiCities)) {
            // Merge and deduplicate
            return Array.from(new Set([...localCities, ...apiCities])).sort();
        }
    } catch {
        // Backend unavailable
    }
    return localCities.sort();
}

export async function addReview(
    professionalId: string,
    reviewerName: string,
    rating: number,
    comment: string,
): Promise<ProfessionalReview> {
    const res = await fetch(`${API_BASE}/${professionalId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            reviewer_name: reviewerName,
            rating: Math.min(5, Math.max(1, rating)),
            comment
        }),
    });
    if (!res.ok) throw new Error('Failed to add review');
    return res.json();
}

export async function getReviews(professionalId: string): Promise<ProfessionalReview[]> {
    try {
        const res = await fetch(`${API_BASE}/${professionalId}/reviews`);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}
