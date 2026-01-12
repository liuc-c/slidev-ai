export namespace config {
	
	export class AIConfig {
	    provider: string;
	    apiKey: string;
	    baseUrl: string;
	    model: string;
	
	    static createFrom(source: any = {}) {
	        return new AIConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.provider = source["provider"];
	        this.apiKey = source["apiKey"];
	        this.baseUrl = source["baseUrl"];
	        this.model = source["model"];
	    }
	}
	export class PromptStyle {
	    id: string;
	    name: string;
	    icon: string;
	    description: string;
	    outlinePrompt: string;
	    slidePrompt: string;
	    isBuiltin: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PromptStyle(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.icon = source["icon"];
	        this.description = source["description"];
	        this.outlinePrompt = source["outlinePrompt"];
	        this.slidePrompt = source["slidePrompt"];
	        this.isBuiltin = source["isBuiltin"];
	    }
	}
	export class PromptConfig {
	    selectedStyleId: string;
	    customStyles: PromptStyle[];
	
	    static createFrom(source: any = {}) {
	        return new PromptConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.selectedStyleId = source["selectedStyleId"];
	        this.customStyles = this.convertValues(source["customStyles"], PromptStyle);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Config {
	    ai: AIConfig;
	    prompts: PromptConfig;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ai = this.convertValues(source["ai"], AIConfig);
	        this.prompts = this.convertValues(source["prompts"], PromptConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	

}

export namespace slidev {
	
	export class Project {
	    id: string;
	    name: string;
	    updated: string;
	    img: string;
	
	    static createFrom(source: any = {}) {
	        return new Project(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.updated = source["updated"];
	        this.img = source["img"];
	    }
	}

}

export namespace updater {
	
	export class UpdateInfo {
	    Available: boolean;
	    Version: string;
	    DownloadURL: string;
	    ReleaseURL: string;
	    Body: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Available = source["Available"];
	        this.Version = source["Version"];
	        this.DownloadURL = source["DownloadURL"];
	        this.ReleaseURL = source["ReleaseURL"];
	        this.Body = source["Body"];
	    }
	}

}

