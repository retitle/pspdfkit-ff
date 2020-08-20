import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

@observer
export default class Home extends Component {
    state = {};

    onClick = async () => {
        console.log("on click");
        const P = (await import('./viewer')).default;
        this.setState({P})
        
    }

    render() {
        const {P} = this.state;
        console.log(P);
        return (
            <div onClick={this.onClick}>
                hello world
                {P && (
                    <P
                        toolbar={false}
                        doc={{
                            pspdfkit_document_id: '123',
                            jwt_token: '123'
                        }}
                    />
                )}
            </div>
        );
    }
}
