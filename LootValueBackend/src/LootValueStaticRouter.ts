import { DependencyContainer } from "tsyringe";
import { RagfairOfferService } from "@spt-aki/services/RagfairOfferService";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { IRagfairOffer } from "@spt-aki/models/eft/ragfair/IRagfairOffer";
import { TradeHelper } from "@spt-aki/helpers/TradeHelper";
import { ProfileHelper } from "@spt-aki/helpers/ProfileHelper";
import { SaveServer } from '@spt-aki/servers/SaveServer';

import type { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import type { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import type { StaticRouterModService} from "@spt-aki/services/mod/staticRouter/StaticRouterModService";

class Mod implements IPreAkiLoadMod
{
	private itemHelper: ItemHelper;
	private offerService: RagfairOfferService;
	private tradeHelper: TradeHelper;
	private profileHelper: ProfileHelper;
	private saveServer: SaveServer;

	private logger: ILogger;
	
    public preAkiLoad(container: DependencyContainer): void {
        const logger = container.resolve<ILogger>("WinstonLogger");
		this.logger = logger;
		
        const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");
		
		//HELPERS
		this.itemHelper = container.resolve<ItemHelper>("ItemHelper");
		this.offerService = container.resolve<RagfairOfferService>("RagfairOfferService");
		this.tradeHelper = container.resolve<TradeHelper>("TradeHelper");
		this.profileHelper = container.resolve<ProfileHelper>("ProfileHelper");
		this.saveServer = container.resolve<SaveServer>("SaveServer");

        // Hook up a new static route
        staticRouterModService.registerStaticRouter(
            "LootValueRoutes",
            [
				{
					url: "/LootValue/GetItemLowestFleaPrice",
					//info is the payload from client in json 
					//output is the response back to client
					action: (url, info, sessionID, output) => {
						return(JSON.stringify(this.getItemLowestFleaPrice(info.templateId)));
					}
				},
            ],
            "custom-static-LootValueRoutes"
        );        
    }

	private getItemLowestFleaPrice(templateId: string): number {
		let offers: IRagfairOffer[] = this.offerService.getOffersOfType(templateId);

		if (offers && offers.length > 0) {
			offers = offers.filter(a => a.user.memberType != 4 //exclude traders
				&& a.requirements[0]._tpl == '5449016a4bdc2d6f028b456f' //consider only ruble trades
				&& this.itemHelper.getItemQualityModifier(a.items[0]) == 1 //and items with full durability
			);
	
			if (offers.length > 0)
				return(offers.sort((a,b) => a.summaryCost - b.summaryCost)[0]).summaryCost;
		}

		return null;
	}
}

module.exports = {mod: new Mod()}