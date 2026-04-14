#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[derive(Clone)]
#[contracttype]
pub struct Campaign {
    pub owner: Address,
    pub goal: i128,
    pub raised: i128,
    pub donor_count: u32,
}

const CAMPAIGN: Symbol = symbol_short!("CMPGN");

#[contract]
pub struct CrowdfundingContract;

#[contractimpl]
impl CrowdfundingContract {
    pub fn init(env: Env, owner: Address, goal: i128) {
        if env.storage().instance().has(&CAMPAIGN) {
            panic!("campaign already initialized");
        }
        owner.require_auth();
        let campaign = Campaign {
            owner,
            goal,
            raised: 0,
            donor_count: 0,
        };
        env.storage().instance().set(&CAMPAIGN, &campaign);
    }

    pub fn donate(env: Env, donor: Address, amount: i128) {
        donor.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let mut campaign: Campaign = env
            .storage()
            .instance()
            .get(&CAMPAIGN)
            .expect("campaign not initialized");

        campaign.raised += amount;
        campaign.donor_count += 1;
        env.storage().instance().set(&CAMPAIGN, &campaign);
        env.events().publish((symbol_short!("donate"), donor), amount);
    }

    pub fn get_campaign(env: Env) -> Campaign {
        env.storage()
            .instance()
            .get(&CAMPAIGN)
            .expect("campaign not initialized")
    }
}
